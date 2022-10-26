const { expose } = require('threads/worker')
const Promise = require('bluebird')
const {spawn, Thread, Worker} = require('threads');


// just find keys dont do shit with them it adds complexity
// at the end this function will return an object where each
// where each key represents a different parsed extraction
const parseFile = async file => {
    
    //extractors
    
    let mongoUrlExtractor = await spawn(new Worker('./parseForMongodbUrls'))
    let privateKeyExtractor = await spawn(new Worker('./parseForPrivateKeys'))
    //let binanceKeyExtractor = await spawn(new Worker('./parseForBinanceKeys'))
    //let stripeKeyExtractor = await spawn(new Worker('./parseForStripeKeys'))
    //let coinbaseKeyExtractor = await spawn(new Worker('./parseForCoinbaseKeys'))
   // let awsCredentialExtractor = await spawn(new Worker("./parseForAwsCredentials"))
    
    // let awsCreds = await awsCredentialExtractor(file).then(async keys => {
    //     setTimeout(async() => {
    //         await Thread.terminate(awsCredentialExtractor)
    //     }, 5000) // wait 5 seconds then terminate
    //     console.log('got aws creds', keys)
    //     return keys
    // })

    // let coinbaseKeys = await coinbaseKeyExtractor(file).then(async keys => {
    //     // console.log('coinbase extractor returned', keys)
    //     setTimeout(async() => {
    //         await Thread.terminate(coinbaseKeyExtractor)
    //     }, 5000)
    //     return keys
    // })
    // console.log('value of coinbase keys', coinbaseKeys)
    let privateKeys = await privateKeyExtractor(file)
    // console.log('value of private keys', privateKeys)
    // let binanceKeys = await binanceKeyExtractor(file).then(async keys => {

    //     setTimeout(async() => {
    //         await Thread.terminate(binanceKeyExtractor)
    //     }, 5000)
    //     return keys
    // })
    // console.log('value of binance keys', binanceKeys)
    // let stripeKeys = await stripeKeyExtractor(file).then(async keys => {
    //     // console.log('stripe key extractor returned', keys)
    //     setTimeout(async() => {
    //         await Thread.terminate(stripeKeyExtractor)
    //     }, 5000)
    //      return keys
    // })
    // console.log('value of stripe keys', stripeKeys)
    let mongoDatabases = await mongoUrlExtractor(file).then(async urls => {
        // console.log('mongo url extractor returned', urls)
        setTimeout(async() => {
            await Thread.terminate(mongoKeyExtractor)
        }, 5000)
        return urls
    })
    // console.log('value of mongo databases', mongoDatabases)
   
    return Promise.resolve({
        //coinbaseKeys,
        //binanceKeys,
        //stripeKeys,
        mongoDatabases,
        privateKeys,
       //awsCreds
    })
  }

  expose(parseFile)