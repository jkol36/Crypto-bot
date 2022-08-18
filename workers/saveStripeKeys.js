const { expose } = require('threads/worker')
const mongoose = require('mongoose')
const Promise = require('bluebird')

require('../models')
const Sentry = require('@sentry/node')


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



expose(stripeKeys => {
   const DATABASE_URL = 'mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority'
   mongoose.connect(DATABASE_URL).then(connection => {
    return Promise.map(stripeKeys, stripeKey => {
        let isLive = stripeKey.includes('pk_live')
        return mongoose.model('stripeKeys').create({token: stripeKey, isLive}).then(res => {
            console.log('stripe keys saved')
            return res.save()
        }).catch(err => Sentry.captureException(err))
    })
   })
})