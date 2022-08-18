
const { expose } = require('threads/worker');
const Promise = require('bluebird');
const { makeOctokitRequest } = require('../middlewares')
const {spawn, Thread, Worker} = require('threads');
const parseCommits = async (initialData) => {
  //console.log('got commit', commit)
  return Promise.each(initialData, async (commit, index) => {
    return makeOctokitRequest(gh.request(`GET ${commit.url}`), gh).then(res => {

      const dotEnv = res.data.data.files.find(file => file.filename === '.env')
      const configs = res.data.data.files.filter(file => file.filename.includes('config') || file.filename.includes('settings'))
      if(configs.length > 0) {
        return Promise.all(Promise.map(configs, config => {
          return makeOctokitRequest(gh.rest.git.getBlob({
            owner: commit.repository.owner.login,
            repo: commit.repository.name,
            file_sha: config.sha
          }), gh).then(async res => {
            const {data, cost} = res
  
            const content = data.data.content
            let file = Buffer.from(content, 'base64').toString('utf-8')
            let fileParser = await spawn(new Worker('./workers/parseFile'))
            await fileParser(file).then(async res => {
                console.log('file done being parsed', res)
                await Thread.terminate(fileParser)
            })
          })
       }))
      }
      if(dotEnv) {
        return makeOctokitRequest(gh.rest.git.getBlob({
          owner: commit.repository.owner.login,
          repo: commit.repository.name,
          file_sha: dotEnv.sha
        }), gh).then(async res => {
          const {data, cost} = res
          
          const content = data.data.content
          let file = Buffer.from(content, 'base64').toString('utf-8')
          let fileParser = await spawn(new Worker('./workers/parseFile'))
          await fileParser(file).then(async res => {
            console.log('file done being parsed', res)
            await Thread.terminate(fileParser)
          })
        })
      }
      else {
         console.log('no configs in commit')
         return Promise.resolve()
      }
    })
  })
}

expose(initialData => parseCommits(initialData))


 