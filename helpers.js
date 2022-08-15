import ccxt from 'ccxt';

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
  }
const initSecretKeyPrefixes = () => {
    const secretKeyPrefixes = ['secret', 'secret_key', 'api_secret', 'API_SECRET', 'SECRET_KEY', 'SECRET', 'apiSecret', 'binanceSecret', 'BINANCE_SECRET_KEY', 'binanceSecretKey', 'BINANCE_SECRET'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                              // I'm using these as a way to identify api keys in peoples code.
                              
    const exchangeSecretKeyPrefixes = ccxt.exchanges.map(item => {
      return [`${item}_secret_key`, `${item.toUpperCase()}_SECRET`, `${item}SecretKey`, `${item}secretKey`, `${item.toUpperCase()}_SECRET_KEY`, `${item}secret`, `${item}Secret`]
    })
    return Promise.resolve([secretKeyPrefixes, ...exchangeSecretKeyPrefixes])
}
const initApiKeyPrefixes = () => {
    const apiKeyPrefixes = ['apiKey', 'api_key', 'BINANCE_API_KEY', 'API_KEY'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
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
    return Promise.resolve([apiKeyPrefixes, ...exchangeApiKeyPrefixes])
  }
export const parseForBinanceKeys = async data => {
    return new Promise((resolve, reject) => {
        const apiKeyPrefixes = initApiKeyPrefixes().reduce((a, b) => [...a, ...b])
        const secretKeyPrefixes = initSecretKeyPrefixes().reduce((a, b) => [...a, ...b])
    
    
    const initialHits = apiKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    let initialHitsForSecrets = secretKeyPrefixes.map(prefix => ({match: data.match(prefix), prefix}))
   
    const tmpTokens = initialHits.filter(hit => hit.match !== null).map(result => {

        const {match, prefix} = result
        const indexOfMatch = match['index']
        const input = match['input']
        let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+64+(prefix.length+4))
        let potentialKey = clean(keyStringInitial.split(prefix)[1])
        if(potentialKey.length === 64) {
            return potentialKey
        }
       
    })
    const tmpSecrets = initialHitsForSecrets.filter(hit => hit.match !== null).map(result => {
        const {match, prefix} = result
        const indexOfMatch = match['index']
        const input = match['input']
        let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+64+(prefix.length+4))
        let potentialSecret = clean(keyStringInitial.split(prefix)[1])
        if(potentialSecret.length === 64) {
            return potentialSecret
        }
        
    })
    const tokens = unique(tmpTokens.filter(token => token !== undefined))
    const secrets = unique(tmpSecrets.filter(secret => secret !== undefined))
    return {tokens, secrets}
  }
    })
    
}
  
  const combineObjects = ([head, ...[headTail, ...tailTail]]) => {
    if (!headTail) return head
  
    const combined = headTail.reduce((acc, x) => {
      return acc.concat(head.map(h => ({...h, ...x})))
    }, [])
  
    return combineObjects([combined, ...tailTail])
  }