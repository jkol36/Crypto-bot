const { expose } = require('threads/worker')
const Sentry = require('@sentry/node')
const ccxt = require('ccxt')
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
const initSecretKeyPrefixes = () => {
  const secretKeyPrefixes = ['secret', 'secret_key', 'api_secret', 'API_SECRET', 'SECRET_KEY', 'SECRET', 'apiSecret', 'coinbaseSecret', 'COINBASE_SECRET_KEY', 'coinbaseSecretKey', 'COINBASE_SECRET'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeSecretKeyPrefixes = ccxt.exchanges.map(item => {
    return [`${item}_secret_key`, `${item.toUpperCase()}_SECRET`, `${item}SecretKey`, `${item}secretKey`, `${item.toUpperCase()}_SECRET_KEY`, `${item}secret`, `${item}Secret`]
  })
  return [secretKeyPrefixes, ...exchangeSecretKeyPrefixes]
}
const initApiKeyPrefixes = () => {
  const apiKeyPrefixes = ['apiKey', 'api_key', 'COINBASE_API_KEY', 'API_KEY', 'APIKEY'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                            // I'm using these as a way to identify api keys in peoples code.
                            
  const exchangeApiKeyPrefixes = ccxt.exchanges.map(item => {
    return [
      `${item}_api_key`, 
      `${item}_API_KEY`, 
      `${item}ApiKey`, 
      `${item}Key`, 
      `${item.toUpperCase()}_api_key`, 
      `${item.toUpperCase()}_API_KEY`, 
      `${item.toUpperCase()}ApiKey`, 
      `${item.toUpperCase()}Key`
    ]
  })
  return [apiKeyPrefixes, ...exchangeApiKeyPrefixes]
}

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
          return potentialKey
      
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
        return potentialSecret
      })
      }
      catch(err) {
        Sentry.captureException(err)

      }
  }
  catch(err){
    Sentry.captureException(err)
     
  }
  const tokens = unique(tmpTokens.filter(token => token !== undefined))
  const secrets = unique(tmpSecrets.filter(secret => secret !== undefined))
  const combos = tokens.map(token => secrets.forEach(secret => ({apiKey: token, secret})))
  console.log(tokens, secrets)
  return Promise.resolve(combos)
})