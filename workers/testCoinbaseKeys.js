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
    console.log('tryng coinbase with', combos)
    return Promise.each(combos, async combo => {
        try {
            let coinbase = new ccxt.coinbase(combo)
            let balance = await coinbase.fetchBalance()
            console.log(balance)
            return mongoose.model('coinbaseAccounts').create({
                apiKey: combo.apiKey,
                secret: combo.secret,
                cryptos: []
            }).then(res => res.save()).then(() => console.log('coinbase account added', combo))

        }
        catch(err) {

        }
    })
  
  })
