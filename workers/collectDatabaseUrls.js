const { expose } = require('threads/worker')
const mongoose = require('mongoose')

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



expose(async () => {
   const ROOT_DATABASE_URL = 'mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority'
   let rootDb = await new mongoose.connect(ROOT_DATABASE_URL)
   let urls = await rootDb.model('mongoUrls').find()
   if(urls) {
    return urls.map(url => url._doc.url)
   }

   
})