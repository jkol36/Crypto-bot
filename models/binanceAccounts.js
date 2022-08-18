const mongoose = require('mongoose')

const binanceAccountSchema = mongoose.Schema({
    token: String,
    secret: String,
    cryptos: Array 
}, {strict: false})

module.exports = mongoose.model('binanceAccounts', binanceAccountSchema)