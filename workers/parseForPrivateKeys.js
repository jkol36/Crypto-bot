const Sentry = require('@sentry/node')
const sha256 = require('sha256')

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

export const parseForPrivateKeys = data => {
 
   //console.log('parsing for private keys', data)
    let regex = /16([a-zA-Z]+([0-9]+[a-zA-Z]+)+)9/g; //for identifying private keys
    let regex2 = /[0-9]+([a-zA-Z]+([0-9]+[a-zA-Z]+)+)/g; // also for identifying private keys
    let regex3 = /^((0x[\da-f]+)|((\d+\.\d+|\d\.|\.\d+|\d+)(e[\+\-]?\d+)?))[ld]?([kmgtp]b)?/i
   
    let regexs = [regex, regex2, regex3]
    
    let privateKeys = []
    const privateKeyPrefixes = ['PRIVATE_KEY =', 'PRIV_KEY = ', 'privKey =', 'seed =', 'seed_phrase =', 'privateKey =', 'ETHEREUM_PRIVATE_KEY =', 'WALLET =', 'priv =', 'METAMASK_PRIVATE_KEY ='] // these are variable name variations ive seen out in the wild people are using when naming their private key variables.
    const initialHits = privateKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    //console.log(initialHits)
    let tmpPrivateKeys
    try {
        tmpPrivateKeys = initialHits.filter(hit => hit.match !== null).map(result => {
            //console.log(result)
            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+64+(prefix.length+4))
            let potentialKey = clean(keyStringInitial.split(prefix)[1])
            if(potentialKey.length === 64) {
                privateKeys.push(potentialKey)
            }
            else {
                console.log('private key length', potentialKey.length)
                console.log('private key', potentialKey)
                privateKeys.push(potentialKey)
            }
        
        })
    }
    catch(err){
        console.log('error with private key', err)
        
    }
    
    
   
    // regexs.forEach(regexExpression => {
    //   const match = data.match(regexExpression)
    //   //console.log({match, regexExpression})
    //   if(match !== null) {
    //     if(match.length > 0) {
    //       match.forEach(potential => {
    //         if(potential.length === 64) {
    //           //console.log('potential key', potential)
    //           privateKeys.push(potential)
    //           privateKeys.push(sha256(potential))
    //         }
    //       })
    //     }
       
    //   }
      
    // })
    return privateKeys
}