import { expect } from 'chai'
import  { Octokit } from '@octokit/rest';
import Web3 from 'web3';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccount';
import mongoose, { MongooseError } from 'mongoose';
// import models from './models';
import Promise from 'bluebird';
import GitHubRepoParser from 'github-repo-parser';
import { convert } from 'html-to-text';
import {spawn, Thread, Worker} from 'threads';
import { makeOctokitRequest } from './middlewares';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { BIP32Interface } from 'bip32';
import { createClient } from 'redis';
import wif from 'wif';
//import { parseForBinanceKeys, clean, parseForMongoDatabaseUrls } from './helpers';

import ccxt from 'ccxt';
import { SentryError } from '@sentry/utils';

const Sentry = require('@sentry/node')

let jon = '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'
let user32 = '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'
let url_binance = 'https://bsc-dataseed.binance.org'
let url_mainnet = "https://mainnet.infura.io/v3/9e34ce9faf8b4c6ca400b914af9cb665"
let url_binance_2 = 'https://bsc-dataseed1.defibit.io/'
const networks = [url_binance, url_mainnet, url_binance_2]
let gh = new Octokit({
  auth:  user32,
  onRateLimit: (retryAfter, options, octokit) => {
    console.log('rate limited')
  }
})
const parser = new GitHubRepoParser(jon)

const initApiKeyPrefixes = () => {
  const apiKeyPrefixes = ['apiKey', 'api_key', 'API_KEY'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeApiKeyPrefixes = ccxt.exchanges.map(item => {
    return [`${item}_api_key`, `${item}_API_KEY`, `${item}ApiKey`, `${item}Key`, `${item}APIKey`]
  })
  return [apiKeyPrefixes, ...exchangeApiKeyPrefixes]
}

const initSecretKeyPrefixes = () => {
  const secretKeyPrefixes = ['secret', 'secret_key', 'api_secret', 'API_SECRET', 'SECRET_KEY', 'SECRET', 'apiSecret'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeSecretKeyPrefixes = ccxt.exchanges.map(item => {
    return [`${item}_secret_key`, `${item}APISecret`, `${item}ApiSecret`, `${item.toUpperCase()}_SECRET`, `${item}SecretKey`, `${item}secretKey`, `${item.toUpperCase()}_SECRET_KEY`, `${item}secret`, `${item}Secret`]
  })
  return [secretKeyPrefixes, ...exchangeSecretKeyPrefixes]
}

const unique = array => {
  return array.filter((a, b) => array.indexOf(a) ===b)
}

const finalClean = arr => {
  return arr.map(item => item.replace('=', ''))
}


describe('tests', async () => {
  let base64RegEx = new RegExp('[^-A-Za-z0-9+/=]|=[^=]|={3,}$')
  
  
  // await redisClient.connect()
  // await redisClient.set('windowReset', 104123)
  // await redisClient.set('numberOfCallsRemainingInWindow', 30)
  // await redisClient.set('rateLimit', 30)
  // before(done  => {
  //   console.log('beforeEach running')
  //   process.on('uncaughtException', err => console.log(err))
  //   process.on('unhandledRejection', err => console.log(err))
  //   mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(res => {
  //     console.log('database connected', res)
  //     done()
  //   })
    
    
  // })
  it('should check private key', async () => {
    let bip32 = BIP32Factory(ecc);
    let key = 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
    let node = bip32.fromBase58(key)
    let child = node.derivePath('m/0/0');
    // console.log(wif.encode(128, ))
    // console.log(node)
  })
  it.only('should search package.json for a library', async () => {
    
  })
  it('should send crypto to metamask', async () => {
    const web3 = require('web3')
    const w3  = new Web3("https://mainnet.infura.io/v3/7dde81cce4ae4281bb8a3e2a70516f98")
    const myAddress = '0x9d79126C830ad9AC789B9781E5A083b1200aD9E1'
    const nonce = await w3.eth.getTransactionCount(myAddress, 'latest'); // nonce starts counting from 0

    const transaction = {
     'to': myAddress, // faucet address to return eth
     'value': 1595897134367, // 1 ETH
     'gas': 30000,
     'nonce': nonce,
     // optional data field to send message or execute smart contract
    };

    const signedTx = await w3.eth.accounts.signTransaction(transaction, '0x0dotCG97m3qCI3SYnR0U0doPK15rTtDQvKaOkKjhZzUvOY9AHuap6kjCOFXzWvkE');

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
    if (!error) {
      console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
    } else {
      console.log("❗Something went wrong while submitting your transaction:", error)
    }
   })
  })
  it('should find matching api keys for secrets', async () => {
    let secrets = [
      
        'SECRET_KEY =C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2',
        'C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2juw48OF5TeeK',
        'SECRET_KEY C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2j',
        ' =C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2juw48OF5Te',
        ' C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2juw48OF5Tee',
        '_KEY =C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2juw48O',
        '_KEY C4pL3f6HHyzRejV12EbbT0Q6FBxDxCKsQussKhCyWlWhdTbfWSg2juw48OF'
      
    ]
    let parsedSecrets = []
    
    parsedSecrets.push(secrets.map(secret => secret.split('=')[1]))
    parsedSecrets.push(secrets.map(secret => secret.split(' ')[1]))
    parsedSecrets = parsedSecrets.reduce((a, b) => [...a, ...b])
    console.log(parsedSecrets)
    parsedSecrets = parsedSecrets.filter(secret => secret !== undefined).map(secret => secret.replace('=', ''))
    Promise.each(parsedSecrets, async secret => {
      gh.rest.search.code({q: secret}).then(console.log)
    })
   

  })
  it('what does code search return' ,async done => {
    //returns code files that have ccxt defined inside
    const code = await makeOctokitRequest(gh.rest.search.code({q: 'ccxt.binance'}), gh).then(async res => {
     
      const uniqueCodeFileUrls = new Set(res.data.data.items.map(item => item.url)) // i want unique paths
      //making one request to test
      
      //now i want to build a new object with only unique code files, but i need other attributes for instance the repo
      const urlArray = Array.from(uniqueCodeFileUrls)
      const testUrl = urlArray[0]
      const content = await makeOctokitRequest(gh.rest.git.getBlob({
        owner: res.data.data.items[0].repository.owner.login,
        repo: res.data.data.items[0].repository.name,
        file_sha: res.data.data.items[0].sha
      }), gh)
      
      const codeFile = Buffer.from(content.data.data.content, 'base64').toString('utf-8')
      console.log(codeFile)
      let fileParser = await spawn(new Worker('./workers/parseFile'))
      let result = await fileParser(codeFile) // kill file parser when done
      console.log(result)

    })
  })
  it('ocotokit request middleware', async () => {
    const initialRepos = await makeOctokitRequest(gh.rest.search.repos({
      q: 'binance',
      order: 'asc',
      page: 1,
      sort: 'best-match',
      per_page: 100
    }), gh)
    console.log('got initial repos', initialRepos)
  })
  it('should find mongodb database urls in .env', done => {
    let commitDetails = {
      owner: 'Thomasyong11',
      repo: 'cakeorderapi',
      file_sha: '9202cce26f533607b1e48e3bb2820847e4fe2892'
    }
    gh.rest.git.getBlob(commitDetails).then(res => {
      //convert from base 64 to utf-8
      let data = Buffer.from(res.data.content, 'base64').toString('utf-8') // what's easier to parse utf-8 or ascii?
      let mongodbUrl = parseForMongoDatabaseUrls(data)
      console.log(mongodbUrl)
      expect(mongodbUrl).to.equal('mongodb+srv://rosseycakes:rosseycakes@cluster0.admto.mongodb.net/orderdb?retryWrites=true&w=majority')
      done()
      //const mongoDbUrl = data.substring(startingIndex, )
    })
  })
  it('should find all collections', done => {
    const url = "mongodb+srv://dbSuperAdmin:WixV4LQRTRKLPbysWOE33JAE@thinkcluster.dvfg3.mongodb.net/bc-think-app"
    const namesList = [];
    mongoose.connection.on("open", function (ref) {
      console.log("Connected to mongo server.");
      //trying to get collection names
      mongoose.connection.db.listCollections().toArray(function (err, names) {
        for (let i = 0; i < names.length; i++) {
          // gets only the name and adds it to a list
          const nameOnly = names[i].name;
          namesList.push(nameOnly);
        }
        namesList.forEach(name => {
          let schema = mongoose.Schema({}, {strict:false})
          mongoose.model(name, schema)
        })
        return Promise.all(Promise.map(namesList, name => {
          return mongoose.model(name).find().then(results => {
            console.log('results for', name)
            console.log(results)
            return results
          })
        }))
      });
    });
    mongoose.connect(url).then(res => {
      console.log(res)
      // const users = mongoose.Schema({}, {strict: false})
      // mongoose.model('users', users)
      //return mongoose.model('users').find()
    }).then(console.log)
  })
  it('should find coinbase api key and secret in text', done => {
    const urls = [
      'https://github.com/cpatgo/funnel/blob/b4f07151fc2970fab3fd4ad7d09a0968e9c4636d/glc/bitcoin/index.php',
    ]
    Promise.map(urls, async url => {
      let text = await gh.request(`GET ${url}`).then(res => convert(res.data, {wordwrap: 130}))
      const apiKeyPrefixes = initApiKeyPrefixes().reduce((a, b) => [...a, ...b])
      const secretKeyPrefixes = initSecretKeyPrefixes().reduce((a, b) => [...a, ...b])
      console.log(secretKeyPrefixes.find(prefix => prefix === 'coinbaseAPISecret'))
      const initialSecretHits = secretKeyPrefixes.map(prefix => ({match: text.match(prefix, 'g'), prefix}))
      const initialHits = apiKeyPrefixes.map(prefix => ({match: text.match(prefix, 'g'), prefix}))
      let tmpTokens
      let tmpSecrets
      try {
        tmpTokens = initialHits.filter(hit => hit.match !== null).map(result => {

            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+16+(prefix.length+4))
            let potentialKey = clean(keyStringInitial.split(prefix)[1])
            console.log(potentialKey)
            if(potentialKey.length === 16) {
                return potentialKey
            }
        
        })
        console.log(tmpTokens)
        try {
        tmpSecrets = initialSecretHits.filter(hit => hit.match !== null).map(result => {
          const {match, prefix} = result
          const indexOfMatch = match['index']
          const input = match['input']
          let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+32+(prefix.length+4))
          let potentialSecret = clean(keyStringInitial.split(prefix)[1])
          console.log(potentialSecret)
          if(potentialSecret.length === 32) {
              return potentialSecret
          }
        })
        }
        catch(err) {
          Sentry.captureException(err)
          console.log(err)
        }
    }
    catch(err){
      Sentry.captureException(err)
        console.log('error with tmpTokens', err)
    }
    return {tokens: unique(tmpTokens), secrets: unique(tmpSecrets)}
    }).then(console.log)
  })
  it('should remove repos', async () => {
    mongoose.model('repos').remove().then(console.log)
  })
  it('should get all topics from db', async () => {
    let topicArry = []
    mongoose.model('repos').find().then(res => {
      console.log('repos')
      res.forEach(item => {
        try {
          const {topics} = item.repo
          topics.forEach(topic => {
            topicArry.push(topic)
          })
        }
        catch(err) {
          return err
        }
      })
      console.log(unique(topicArry))
    })
  })
  it('should find api key in repo', async () => {
    const urls = [
      'https://github.com/DGKang234/ML_for_fun/blob/32284e92ce2c2cba258aecd9daea95497fb6cfe9/binance/binance_fitting_k_Larry.py',
      'https://github.com/SS-FS-58/arbitrage_bot/blob/16d26d68a364973b725ed15d6492e988e71a9cc8/binance_ccxt.py',
      'https://github.com/s260895/ada22/blob/23fe7b6bc248ef6ca133ff58401b7d1610ae7e62/price-fetch-ms/main.py'
    ]
    const url = "https://github.com/SS-FS-58/arbitrage_bot/blob/16d26d68a364973b725ed15d6492e988e71a9cc8/binance_ccxt.py"
    Promise.map(urls, async url => {
      let hits = 0
      let text = await gh.request(`GET ${url}`).then(res => convert(res.data, {wordwrap: 130}))
      return parseForBinanceKeys(text).then(tokens => {
        console.log('tokens for url', url)
        console.log(tokens)
      })
    })
        
   })
 
    

  })
  
  

  it('should add crypto accounts to db and save them', async () => {
    mongoose.model('binanceAccounts').create(
      {
      token: 'zyN3R5T1FOPwKLBvxnf09X6EkKzcIEBCes1RpNqD6moXU7YoqOBX3M2vFcUgCAQy',        
      secret: 'dQMgSnNJs3MrBvU5qx65WYmn7PIAK9o0LLjLLVmPicjjCsWTA3iFA6H9UwDKn55h',       
      cryptos: [
        { crypto: 'BTC', balance: 0.00754945 },
        { crypto: 'USDT', balance: 75.82065341 },
        { crypto: 'MATIC', balance: 35.8641 },
        { crypto: 'BUSD', balance: 113.1459823 },
        { crypto: 'SAND', balance: 9.98071452 },
        { crypto: 'LUNA', balance: 0.13644845 },
        { crypto: 'LUNC', balance: 0.00253 }
      ],
      
    }).then(doc => {
      console.log('got doc', doc)
      return doc.save()
    })
  })
  it('should fetch all crypto accounts from mongo', done => {
   mongoose.model('binanceAccounts').find({}).then(accounts => {
    //expect(accounts).to.not.be.undefined
    console.log('got accounts from db', accounts)
    done()
   }).catch(console.log)

  })
  it('should find all api secrets in code file', async () => {
    let url = 'https://github.com/snroptimus/crypto_bot/blob/68f399a3aaa5df3130a8882dc4a0243e6c4959d0/app/ArbitrageInterface.py'
    let exampleFile = await gh.request(`GET ${url}`).then(res => convert(res.data, {
      wordwrap: 130
    }))
    let secrets = []
    let allApiSecretIndices = [...exampleFile.matchAll(new RegExp('binanceSecret', 'gi'))].map(a => a.index)
    allApiSecretIndices.forEach(index => {
      let secret = exampleFile
      .substring(index, index+100)
      .replace(/[\r\n]/gm, '')
      .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
      .replace('binanceSecret', '') // i replace the prefix we're using wth an empty string
      .replace('=', '') // I replace the assignment operator. This is going to be either : or = depending on whether were inside an object or dealing with a variable. Either way, I replace it with an empty string.
      .split(' ')[1] // we dont want extra spaces either or our key will be one character off
      // .substring(0, 64) 
       //we'll get the api key string as is then parse out all special characters and line breaks as well as the /n character. Our goal is to get this into the purest form possible.
      // if it passes our base 64 test we push it


      secret.length === 64 ? secrets.push(secret): null
    })
    console.log('secrets', secrets)


  })

  it('should parse out the repo name from the commit. I need this in order to find all crypto related repos', async () => {
    console.log(redisClient)
    const redisClient = createClient({
      url: "redis://redis-15304.c258.us-east-1-4.ec2.cloud.redislabs.com:15304",
      password: 'onQCc19X9AKWNV49irmBFEDlNKoUMp96'
    })
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect()
    await redisClient.set('windowReset', 104123)
    await redisClient.set('numberOfCallsRemainingInWindow', 30)
    await redisClient.set('rateLimit', 30)
    //query the first 10 pages (1000 results)
    let commits = []
    let filters = ['crypto', 'arb', 'money', 'coinbase', 'eth', 'btc', 'binance', 'nft', 'metamask', 'trader', 'bot']
    for(let i=0; i<= 8; i++) { // 600 results
      const {data:{items}} = await makeOctokitRequest(gh.rest.search.commits({
        q: 'remove .env',
        sort: 'asc',
        sort_by: 'authored',
        page: i,
        per_page: 100
      }), redisClient)
      console.log(items[0].html_url)
      filters.forEach(filter => {
        let results = items.filter(commit => commit.repository.name.includes(filter))
        for(let t=0; t< results.length; t++) {
          commits.push(results[t])
        }
      })
     
    }
    console.log('got commits', commits.map(commit => commit.html_url))
    
   
  })
	it('should find api_key in code file', async () => {
    const exampleFile = await gh.request('GET https://github.com/QuangNamVu/thesis/blob/01a404de2dfb70f13f3e61a9a8f3b73c88d93502/src/crawl_data/ccxt_example.py').then(res => convert(res.data, {
      wordwrap: 130
    }))
    
    const potentialApiKeys = [...exampleFile.matchAll(new RegExp('apiKey', 'gi'))].map(a => a.index) // these are the start indexes of each occurence of apiKey. More work is needed to get the actual values.
    let apiKeys = [] // i'm going to have to remove all new lines now, line breaks and special characters.
    potentialApiKeys.forEach(index => {
      let apiKey = exampleFile
      .substring(index, index+100)
      .replace(/[\r\n]/gm, '')
      .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')
      .replace('apiKey', '')
      .replace(' ', '')
      .substring(0, 64)
      console.log('api key test 2', apiKey)
      apiKey.length === 64 ? apiKeys.push(apiKey): null
    })
    console.log('apiKeys test 2', apiKeys)
    //filter out duplicates
    console.log(apiKeys.filter((a, b) => apiKeys.indexOf(a) === b))
  }) 
  
