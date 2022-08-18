const { expose } = requre('threads/worker')
const Promise = require('bluebird')
const {spawn, Thread, Worker} = require('threads');


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

  expose(file => parseFile(file))