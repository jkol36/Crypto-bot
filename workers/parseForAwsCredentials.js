
const { expose } = require('threads/worker')


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


expose(function parseForAWSCredentials(data) {
    const secretKeyPrefixes = ["aws_secret_access_key", 'AWS_SECRET']
    const apiKeyPrefixes = ['aws_access_key_id', 'AWS_ACCESS']
   
    
    
    const initialHits = apiKeyPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    //console.log(initialHits.filter(item => item.match !== null))
    let initialHitsForSecrets = secretKeyPrefixes.map(prefix => ({match: data.match(prefix), prefix}))
    let tmpTokens
    let tmpSecrets
    try {
        tmpTokens = initialHits.filter(hit => hit.match !== null).map(result => {

            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+20+(prefix.length+4))
            let potentialKey = clean(keyStringInitial.split(prefix)[1])
            console.log('potential aws key is', potentialKey)
            return potentialKey
           
        
        })
    }
    catch(err){
        console.log('error with tmpTokens', err)
    }
    try {
        tmpSecrets = initialHitsForSecrets.filter(hit => hit.match !== null).map(result => {
            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+40+(prefix.length+4))
            let potentialSecret = clean(keyStringInitial.split(prefix)[1])
            console.log('potential aws secret', potentialSecret)
            return potentialSecret
            
            
        })
    }
    catch(err) {
        Sentry.captureException(err)
        console.log('error getting temp secrets', err)
    }

    const tokens = unique(tmpTokens.filter(token => token !== undefined))
    const secrets = unique(tmpSecrets.filter(secret => secret !== undefined))
    const combos = tokens.map(token => secrets.map(secret => ({apiKey: token, secret}))).reduce((a, b) => [...a, ...b], [])
    console.log('aws keys', combos)
    return Promise.resolve(combos)
})
 