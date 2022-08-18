




export const makeOctokitRequest = async (request, ghAccount) => {
// pass any octokit object here to check rate limit info before firing off a request
/// also logs how many api calls a request takes
    const rateLimitData = await ghAccount.rateLimit.get()
    //console.log(rateLimitData.data.resources.core)
    let callsAvailableBefore = rateLimitData.data.rate.remaining
    console.log('calls available', callsAvailableBefore)
    if(callsAvailableBefore > 10) {
       return request.then(async data => {
            let rateLimitDataAfter = await ghAccount.rateLimit.get()
            let cost = callsAvailableBefore - rateLimitDataAfter.data.rate.remaining
            return {data, cost}
        })
    }
    else {
        return {data: {
            status: 'rejected',
            resetsAt: rateLimitData.data.rate.reset,
            message: 'need to wait there are not enough api calls available. You can also use another github account.'
        }}
    }
}