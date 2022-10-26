const { expose } = require('threads/worker')
const AWS = require('aws-sdk')
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
    console.log('tryng aws with', combos)
    return Promise.each(combos, async combo => {
        try {
            AWS.config.update({region: 'us-east-1', credentials: {accessKeyId: combo.apiKey, secretAccessKey: combo.secret}})
            new AWS.EC2().describeInstances().promise().then(console.log)

        }
        catch(err) {
          console.log(err)
            console.log('account didnt work for aws', combo)

        }
    })
  
  })
