const { expose } = require('threads/worker')
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
  
expose(function parseForMongodbUrls(data) {
    try{
        let startingKeyword = 'mongodb'
        let endingKeyWord = 'majority'
        let endingKeyWordLength = endingKeyWord.length
        let startingIndex = data.match(startingKeyword, 'g')['index']
        let endingIndex = data.match(endingKeyWord)['index']
        let mongodbUrl = data.substring(startingIndex, endingIndex+endingKeyWordLength)
        return mongodbUrl
    }
    catch(err) {
        Sentry.captureException(err)
    }
    
})