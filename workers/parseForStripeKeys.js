const { expose } = require('threads/worker')
const Sentry = require('@sentry/node')
const Promise = require('bluebird')

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
  

  const unique = array => {
    return array.filter((a, b) => array.indexOf(a) ===b)
  }
const clean = string => {
    return string
        .replace(/\s/g, "")
        .replace(/['"]+/g, '')
        .replace(/['']+/g, '')
        .replace(/['=']+/g, '')
        .replace(/[':']+/g, '')
        .replace(/['//']+/g, '')
  }

expose(data => {
    let regex = /16([a-zA-Z]+([0-9]+[a-zA-Z]+)+)9/g; //for identifying private keys
    let regex2 = /[0-9]+([a-zA-Z]+([0-9]+[a-zA-Z]+)+)/g; // also for identifying private keys
   
    let regexs = [regex, regex2]
    
    let stripeKeys = []
    const stripeKeyPrefixes = ['STRIPE_KEY', 'stripeKey', 'STRIPEKEY'] // these are variable name variations ive seen out in the wild people are using when naming their private key variables.
    const initialHits = stripeKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    let tmpStripeKeys
    try {
        tmpStripeKeys = initialHits.filter(hit => hit.match !== null).map(result => {

            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+107+(prefix.length+4))
            let potentialKey = clean(keyStringInitial.split(prefix)[1])
            stripeKeys.push(potentialKey)
        
        })
    }
    catch(err){
        console.log('error with private key', err)
        Sentry.captureException(err)
        return []
    }
    
    
   
    // regexs.forEach(regexExpression => {
    //   const match = data.match(regexExpression)
    //   //console.log({match, regexExpression})
    //   if(match !== null) {
    //     match.forEach(potential => {
    //       if(potential.length === 64) {
    //         //console.log('potential key', potential)
    //         privateKeys.push(potential)
    //       }
    //     })
    //   }
     
    // })
    return tmpStripeKeys
})