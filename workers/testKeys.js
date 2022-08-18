const { expose } = require('threads/worker')
const Web3 = require('web3')
const Sentry = require('@sentry/node')
const Promise = require('bluebird')
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


  const networks = [
    'https://bsc-dataseed.binance.org',
    "https://mainnet.infura.io/v3/9e34ce9faf8b4c6ca400b914af9cb665",
     'https://bsc-dataseed1.defibit.io/'
  ]
  
expose(async keys => {
    let { privateKeys}  = keys;
    if(privateKeys.length > 0) {
      console.log(privateKeys)
      return Promise.all(Promise.map(privateKeys, async (key) => {
        return Promise.map(networks, async network => {
          let w3 = new Web3(network)
          let account
          let balance
          try {
            account = await w3.eth.accounts.privateKeyToAccount(key)
            balance = await w3.eth.getBalance(account.address)
            console.log(account)
            if(balance > 0) {
              console.log(account)
              console.log('wei balance', balance)
             return mongoose.model('cryptoAccounts').create({
                privateKey: key,
                balance,
                address: account.address
              })
            }
          }
          catch(err) {
            console.log('account didnt work', key)
            Sentry.captureException(err)
            return Promise.resolve(key)
          }
        })
      }))
    }
  
  })
