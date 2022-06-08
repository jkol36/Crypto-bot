import agent from 'superagent-bluebird-promise';
import  { Octokit } from '@octokit/rest';
const Promise = require('bluebird');

const gh = new Octokit({
  auth: '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'
})

let urls = []
const getCommits = (owner, repo) => {
        console.log('fetching commits', owner, repo);
	return gh.rest.repos.listCommits({owner, repo}).then(commits => {
        commits.data.map(item => urls.push(item.html_url))
        console.log(urls)
})
}

const searchCode = (query, page) => {
  return  gh.rest.search.code({q: query, page, order:'asc', sort: 'indexed', per_page: 100})
   .then(res => {
     const data = res.data.items;
     console.log(data[0])
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


const query = 'from binance import Client'
for(var i=0; i<10; i++) {
	searchCode(query, i).then(res => console.log('got here', urls.length))
}


