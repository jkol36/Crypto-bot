import agent from 'superagent-bluebird-promise';
import  { Octokit } from '@octokit/rest';
const Promise = require('bluebird');


let urls = []
let jon = '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'
let thesavage = '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'
let accounts = ['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']
let account = accounts[Math.floor(Math.random()*accounts.length)];
console.log('account is', account)
const gh = new Octokit({
  auth:  thesavage
})
const getCommits = (owner, repo) => {
        //console.log('fetching commits', owner, repo);
	return gh.rest.repos.listCommits({owner, repo}).then(res => {
           console.log(res.data.map(item => item.html_url))
})
}

const searchCode = (query, page) => {
  return  gh.rest.search.code({q: query, page, order:'asc', sort: 'indexed', per_page: 100})
   .then(res => {
     return res.data.items
  })
}
const searchRepos = (query, page) => {
  let urls = []
 return gh.rest.search.repos({q: 'from binance import Client', page, per_page: 100, order:'asc', sort:'indexed'}).then(res => {
        const { data } = res;
        //console.log(data.items[0]) 
	return Promise.all(Promise.map(data.items, item => {
           return getCommits(item.owner.login, item.name)
    }))
 })
}


const query = 'import binance'

//const isRateLimited = () => {
 //return gh.rest.rateLimit.get()
//}

//isRateLimited().then(res => console.log('rate limit info', res))
for(var i=0; i<10; i++) {
	searchCode(query, i).then(res => {
	const owners = res.map(item => item.repository.owner.login)
	const repos = res.map(item => item.repository.name)
        return Promise.all(Promise.map((res), repo => {
	const owner = repo.repository.owner.login;
	const rep = repo.repository.name
	console.log('got owner', owner)
	console.log('got repo', rep)
         return getCommits(repo.repository.owner.login, repo.repository.name)
   }))
})
}
