const mongoose = require('mongoose')
const ccxt = require('ccxt')


export const unique = array => {
    return array.filter((a, b) => array.indexOf(a) ===b)
  }

export const shuffle= array => {
    let tmp = []
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        tmp.push(array[j])
    }
    console.log(array.length, 'vs', tmp.length)
    return tmp
}
export const clean = string => {
    return string
        .replace(/\s/g, "")
        .replace(/['"]+/g, '')
        .replace(/['']+/g, '')
        .replace(/['=']+/g, '')
        .replace(/[':']+/g, '')
        .replace(/['//']+/g, '')
  }
export const initSecretKeyPrefixes = () => {
    const secretKeyPrefixes = ['secret', 'secret_key', 'api_secret', 'API_SECRET', 'SECRET_KEY', 'SECRET', 'apiSecret', 'binanceSecret', 'BINANCE_SECRET_KEY', 'binanceSecretKey', 'BINANCE_SECRET'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                              // I'm using these as a way to identify api keys in peoples code.
                              
    const exchangeSecretKeyPrefixes = ccxt.exchanges.map(item => {
      return [`${item}_secret_key`, `${item.toUpperCase()}_SECRET`, `${item}SecretKey`, `${item}secretKey`, `${item.toUpperCase()}_SECRET_KEY`, `${item}secret`, `${item}Secret`]
    })
    return [secretKeyPrefixes, ...exchangeSecretKeyPrefixes]
}
export const initApiKeyPrefixes = () => {
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
    return [apiKeyPrefixes, ...exchangeApiKeyPrefixes]
  }





  