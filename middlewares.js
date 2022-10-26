
const sentry = require('@sentry/node')
const { Octokit } = require('@octokit/rest')
const HttpProxyAgent = require('http-proxy-agent');
const proxies = require('./proxies.json')
const Promise = require('bluebird')
//let jon2 = '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'
let jon = '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'
let user32 = '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'
//let eaglesfan = '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'
//middle ware for logging x-rate-limit-remaining headers in redis so I dont get rate limited
const makeOctokitRequest = async (request, redisClient) => {
    let numberOfCallsRemainingInWindow = await redisClient.get('numberOfCallsRemainingInWindow')
    let reset = await redisClient.get('windowReset')
    console.log('window reset', reset)
    console.log('calls remaing', numberOfCallsRemainingInWindow)
    if(numberOfCallsRemainingInWindow > 0 || !numberOfCallsRemainingInWindow) {
        return request.then(async data => {
            let rateLimit = data.headers['x-ratelimit-limit']
            let numberOfCallsRemainingInWindow = data.headers['x-ratelimit-remaining']
            let windowReset = data.headers['x-ratelimit-reset']
            console.log('updating cache with api call data')
            await redisClient.set('rateLimit', rateLimit)
            await redisClient.set('numberOfCallsRemainingInWindow', numberOfCallsRemainingInWindow)
            await redisClient.set('windowReset', windowReset)
            
            return data
        }).catch(async err => {
            switch(err.status) {
                case 403:
                    console.log('rate limited. Will try again in 2 minutes')
                    await Promise.delay(120000)
                    console.log('trying request again')
                    return makeOctokitRequest(request, redisClient)

                    
                case 404:
                    console.log('not found', err)
                    return []
                default:
                    console.log(err)
                    

                    
                
                
            }
        })
    }
    else {
        console.log('else running')
        await Promise.delay(10000)
        return makeOctokitRequest(request, redisClient)
    }
   
}

module.exports.makeOctokitRequest = makeOctokitRequest