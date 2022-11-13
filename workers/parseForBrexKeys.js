
const { expose } = require('threads/worker')
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

const initApiKeyPrefixes = () => {
    const apiKeyPrefixes = ['apiKey', 'privKey', 'token', 'api_key', 'BREX_KEY', 'BREX_API_KEY', 'API_KEY', 'APIKEY'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                              // I'm using these as a way to identify api keys in peoples code.
                              
    return apiKeyPrefixes
  }


expose(function parseForBrexKeys(data) {
    const apiKeyPrefixes = initApiKeyPrefixes()
   
    
    
    const initialHits = apiKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    //console.log(initialHits.filter(item => item.match !== null))
    let tmpTokens
    try {
        tmpTokens = initialHits.filter(hit => hit.match !== null).map(result => {

            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+64+(prefix.length+4))
            let potentialKey = clean(keyStringInitial.split(prefix)[1])
            return potentialKey
           
        
        })
    }
    catch(err){
        console.log('error with tmpTokens', err)
    }

    const tokens = unique(tmpTokens.filter(token => token !== undefined))
    const apiKeys = tokens.map(token => ({apiKey:token}))
    //console.log('brex keys', apiKeys)
    return Promise.resolve(apiKeys)
})
 