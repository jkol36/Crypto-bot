async function parseRepos(query,  ghAccount) {
    let urlsQueried = []
    let reposAlreadyLookedAt = 0
    let percentageDone
    setInterval(() => checkStatus(percentageDone), 12000)
    const page = 1//Math.floor(Math.random() * (10 - 1 + 1) + 1)
    console.log('query is', query, 'page is', page)
    const initialRepos = await ghAccount.rest.search.repos({
      q: query,
      order: 'asc',
      page,
      sort: 'best-match',
      per_page: 100
    })
    let nodes = initialRepos.data.items
    console.log('working with', nodes.length)
    
    let uniqueRepos = new Set(nodes)
    let uniqueRepoArray = Array.from(uniqueRepos)
    let promises = []
    //console.log(uniqueRepoArray.map(item => item))
    promises.push(Promise.map(uniqueRepoArray, async () => {
      const randomRepo = pickRandomUrl(uniqueRepoArray)
      let repoInDb = await mongoose.model('repos').findOne({html_url: randomRepo.html_url})
      if(urlsQueried.indexOf(randomRepo.html_url) !== -1) {
        reposAlreadyLookedAt += 1
        return Promise.resolve({})
      }
     // console.log('repo in db', repoInDb)
     if(repoInDb) {
      reposAlreadyLookedAt +=1
      percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page} lookedAt: ${reposAlreadyLookedAt}, reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
      //console.log('skipping repo')
  
      //console.log(percentageDone)
      return Promise.resolve({})
     }
    return handleRepo(randomRepo, ghAccount).then(() => {
    urlsQueried.push(randomRepo.html_url)
    reposAlreadyLookedAt += 1
    let percentageDone = `percentageDone ${reposAlreadyLookedAt / uniqueRepoArray.length}, totalRepos: ${uniqueRepoArray.length}, page: ${page}, lookedAt: ${reposAlreadyLookedAt},  reposAlreadyLookedAt: ${reposAlreadyLookedAt}, url: ${randomRepo.html_url} `;
    //console.log(percentageDone)
    }).catch(err => {
    Sentry.captureException(err)
    })
    
    
    }))
    return Promise.all(promises).catch(err=> Sentry.captureException(err))

}
  