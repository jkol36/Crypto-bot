import admin from 'firebase-admin';
import serviceAccount from './serviceAccount';
import  { Octokit } from '@octokit/rest';

let jon = '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';
let user32 = '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'

let gh = new Octokit({
    auth:  user32,
    onRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      );
    }
  })

const repo = {
    id: 185592123,
    node_id: 'MDEwOlJlcG9zaXRvcnkxODU1OTIxMjM=',
    name: 'trading',
    full_name: 'fabius8/trading',
    private: false,
    owner: {
      login: 'fabius8',
      id: 9312696,
      node_id: 'MDQ6VXNlcjkzMTI2OTY=',
      avatar_url: 'https://avatars.githubusercontent.com/u/9312696?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/fabius8',
      html_url: 'https://github.com/fabius8',
      followers_url: 'https://api.github.com/users/fabius8/followers',
      following_url: 'https://api.github.com/users/fabius8/following{/other_user}', 
      gists_url: 'https://api.github.com/users/fabius8/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/fabius8/starred{/owner}{/repo}',   
      subscriptions_url: 'https://api.github.com/users/fabius8/subscriptions',      
      organizations_url: 'https://api.github.com/users/fabius8/orgs',
      repos_url: 'https://api.github.com/users/fabius8/repos',
      events_url: 'https://api.github.com/users/fabius8/events{/privacy}',
      received_events_url: 'https://api.github.com/users/fabius8/received_events',  
      type: 'User',
      site_admin: false
    },
    html_url: 'https://github.com/fabius8/trading',
    description: "Let's make money easy! Hohaha~",
    fork: false,
    url: 'https://api.github.com/repos/fabius8/trading',
    forks_url: 'https://api.github.com/repos/fabius8/trading/forks',
    keys_url: 'https://api.github.com/repos/fabius8/trading/keys{/key_id}',
    collaborators_url: 'https://api.github.com/repos/fabius8/trading/collaborators{/collaborator}',
    teams_url: 'https://api.github.com/repos/fabius8/trading/teams',
    hooks_url: 'https://api.github.com/repos/fabius8/trading/hooks',
    issue_events_url: 'https://api.github.com/repos/fabius8/trading/issues/events{/number}',
    events_url: 'https://api.github.com/repos/fabius8/trading/events',
    assignees_url: 'https://api.github.com/repos/fabius8/trading/assignees{/user}', 
    branches_url: 'https://api.github.com/repos/fabius8/trading/branches{/branch}', 
    tags_url: 'https://api.github.com/repos/fabius8/trading/tags',
    blobs_url: 'https://api.github.com/repos/fabius8/trading/git/blobs{/sha}',      
    git_tags_url: 'https://api.github.com/repos/fabius8/trading/git/tags{/sha}',    
    git_refs_url: 'https://api.github.com/repos/fabius8/trading/git/refs{/sha}',    
    trees_url: 'https://api.github.com/repos/fabius8/trading/git/trees{/sha}',      
    statuses_url: 'https://api.github.com/repos/fabius8/trading/statuses/{sha}',    
    languages_url: 'https://api.github.com/repos/fabius8/trading/languages',        
    stargazers_url: 'https://api.github.com/repos/fabius8/trading/stargazers',      
    contributors_url: 'https://api.github.com/repos/fabius8/trading/contributors',  
    subscribers_url: 'https://api.github.com/repos/fabius8/trading/subscribers',    
    subscription_url: 'https://api.github.com/repos/fabius8/trading/subscription',  
    commits_url: 'https://api.github.com/repos/fabius8/trading/commits{/sha}',      
    git_commits_url: 'https://api.github.com/repos/fabius8/trading/git/commits{/sha}',
    comments_url: 'https://api.github.com/repos/fabius8/trading/comments{/number}', 
    issue_comment_url: 'https://api.github.com/repos/fabius8/trading/issues/comments{/number}',
    contents_url: 'https://api.github.com/repos/fabius8/trading/contents/{+path}',  
    compare_url: 'https://api.github.com/repos/fabius8/trading/compare/{base}...{head}',
    merges_url: 'https://api.github.com/repos/fabius8/trading/merges',
    archive_url: 'https://api.github.com/repos/fabius8/trading/{archive_format}{/ref}',
    downloads_url: 'https://api.github.com/repos/fabius8/trading/downloads',        
    issues_url: 'https://api.github.com/repos/fabius8/trading/issues{/number}',     
    pulls_url: 'https://api.github.com/repos/fabius8/trading/pulls{/number}',       
    milestones_url: 'https://api.github.com/repos/fabius8/trading/milestones{/number}',
    notifications_url: 'https://api.github.com/repos/fabius8/trading/notifications{?since,all,participating}',
    labels_url: 'https://api.github.com/repos/fabius8/trading/labels{/name}',       
    releases_url: 'https://api.github.com/repos/fabius8/trading/releases{/id}',     
    deployments_url: 'https://api.github.com/repos/fabius8/trading/deployments'     
}
const cryptoStealerFirebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
const firestore = cryptoStealerFirebase.firestore()

const repoParser = async (runInitial, repo, tree_sha, file_path) => { //finds all files in repo
    console.log('called', firestore)
  
    const excludedExtensions = ['png', 'md', 'gitignore']
    let folders
    let files
    let content 
    if(runInitial) {
      console.log('got here')
      let tree = await gh.rest.git.getTree({
        owner: repo.owner.login,
        repo: repo.name,
        tree_sha
      })
      console.log('got tree', tree)
      firestore.collection('bot_state').add(repo).then(console.log)
      console.log('got here yoo')
      let savedTreeSha = await firestore.collection('bot_state').doc('current_tree_sha').set({tree_sha}).then(() => console.log('tree sha saved in firebase')).catch(console.log)
      console.log(savedTreeSha)
      content = tree.data.tree
      console.log('got here')
    }
    else {
      await firestore.collection('bot_state').doc('current_file_path').set({file_path}).then(() => console.log('current file path saved in firebase'))
      content = await gh.rest.repos.getContent({
        owner: repo.owner.login,
        repo: repo.name,
        path: file_path
      })
    }
    if(content) {
      folders = content
        .filter(item => excludedExtensions.indexOf(item.path.split('.')[1]) == -1)
        .filter(item => item.type === 'tree' || item.type === 'folder')
      files = content
      .filter(item => excludedExtensions.indexOf(item.path.split('.')[1]) == -1)
      .filter(item => item.type !== 'tree' && item.type !== 'folder')
    }
    if(files) {
      let tmpFiles = files.map(file => Object.assign({}, file, {isChecked: false}))
      console.log('handle files', files.length)
      await saveDataToFirebase('files', tmpFiles) //files are sent to firebase to be parsed seperately // dont want to use api calls for that right now
  
    }
    if(folders) {
      console.log('handle folders', folders.length)
      let tmpFolders = folders.map(folder => Object.assign({}, folder, {contentsFetched: false}))
      await saveDataToFirebase('folders', tmpFolders).then(() => console.log('folders saved'))
    }
    console.log('got here')
    
  }

  const commitDetails = gh.rest.repos.listCommits({
    owner: repo.owner.login,
    repo: repo.name
  }).then(commitDetails => {
    const mostRecentCommit = commitDetails.data.reverse()[0] // the most recent commit is the last in the array
    const tree_sha = mostRecentCommit.commit.tree.url.split('/trees/')[1]
    return repoParser(true, repo, tree_sha, null)
  })
  