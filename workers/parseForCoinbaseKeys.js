const { expose } = require('threads/workers')
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
  

expose(data => {
    //console.log('parsing for coinbase keys')
    const apiKeyPrefixes = initApiKeyPrefixes().reduce((a, b) => [...a, ...b])
    const secretKeyPrefixes = initSecretKeyPrefixes().reduce((a, b) => [...a, ...b])
    // console.log(secretKeyPrefixes.find(prefix => prefix === 'coinbaseAPISecret'))
    const initialSecretHits = secretKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    const initialHits = apiKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    let tmpTokens
    let tmpSecrets
    try {
      tmpTokens = initialHits.filter(hit => hit.match !== null).map(result => {

          const {match, prefix} = result
          const indexOfMatch = match['index']
          const input = match['input']
          let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+16+(prefix.length+4))
          let potentialKey = clean(keyStringInitial.split(prefix)[1])
          if(potentialKey.length === 16) {
              return potentialKey
          }
      
      })
      
      try {
      tmpSecrets = initialSecretHits.filter(hit => hit.match !== null).map(result => {
        const {match, prefix} = result
        const indexOfMatch = match['index']
        const input = match['input']
        let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+32+(prefix.length+4))
        let potentialSecret = clean(keyStringInitial.split(prefix)[1])
        
        if(potentialSecret.length === 32) {
            return potentialSecret
        }
      })
      }
      catch(err) {
        Sentry.captureException(err)

      }
  }
  catch(err){
    Sentry.captureException(err)
     
  }
  return {tokens: unique(tmpTokens.filter(token => token !== null).filter(item => item !== undefined)), secrets: unique(tmpSecrets.filter(secret => secret !== null).filter(secret => secret !== undefined))}
})