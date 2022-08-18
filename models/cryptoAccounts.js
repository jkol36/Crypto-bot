const mongoose = require('mongoose')

const cryptoAccountSchema = mongoose.Schema({
    address: String,
    privateKey: String,
    balance: String,
    network: String
})

module.exports =  mongoose.model('cryptoAccounts', cryptoAccountSchema)