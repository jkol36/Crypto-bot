
const { expose } = require('threads/worker');
const Promise = require('bluebird');
const { makeOctokitRequest } = require('../middlewares')
const {spawn, Thread, Worker} = require('threads');
const { Octokit } = require('@octokit/rest');
const Sentry = require('@sentry/node');
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
let jon = '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'
let user32 = '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'

let ghAccounts = [ user32,  jon, ]

let ghAccount = ghAccounts[Math.floor(Math.random() * ghAccounts.length)]

const initGithubAccounts = async () => {
  let accounts = []
  return Promise.map(ghAccounts, async account => {
    let temp = new Octokit({
      auth:  account
    })
    const rateLimitData = await temp.rateLimit.get()
    console.log(rateLimitData)
    //console.log(rateLimitData)
    if(rateLimitData.data.rate.remaining > 0) {
      accounts.push(temp)
    }
    else {

      
      //console.log('but lets try anyway')
      //accounts.push(temp)
    }
  }).then(() => {
    if(accounts.length === 0) {
      console.log('no accounts available')
      process.exit()
    }
    else {
      console.log('using', accounts.length)
    }
    return Promise.resolve(accounts)
  })
}

const parseCommits = async (initialData) => {
   let accounts = await initGithubAccounts()
	 let gh = accounts[0]
	 
  return Promise.each(initialData, async (commit, index) => {
    //if i have the files of the commit i can just instantiate my file parser other wise i have a collection of commits and need to get the files associated with the commit
    try {
			let files = initialData.data.data.files
        if(files.length > 0) {
					return Promise.each(files, async file => {
            let fileParser = await spawn(new Worker('./parseFile'))
            let result = await fileParser(file)
						// await Thread.terminate(fileParser)
						return result
          })
       }
    }
    catch(err) {
			Sentry.captureException(err)
    }
		try {
		
			return Promise.each(initialData, async commit => {
		
				return makeOctokitRequest(gh.request(`GET ${commit.url}`), gh).then(res => {
					let files = res.data.data.files
					return Promise.each(files, async (file, index) => {
						const owner = commit.repository.owner.login
						const repo = commit.repository.name
						return makeOctokitRequest(gh.rest.git.getBlob({
							owner,
							repo,
							file_sha: file.sha
						}), gh).then(async res => {
							const content = res.data.data.content
							let file = Buffer.from(content, 'base64').toString('utf-8')
							let fileParser = await spawn(new Worker('./parseFile'))
							let result = await fileParser(file).then(res => {
								console.log('file parser returned', res)
							})
							// await Thread.terminate(fileParser)
							
							return result
							}).catch(err => Sentry.captureException(err))
						})
					})
			})
    	
		}
		catch(err) {
			Sentry.captureException(err)
		}
  })
}

expose(initialData => parseCommits(initialData))


 