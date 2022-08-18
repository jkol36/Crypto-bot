const mongoose = require('mongoose')

const coinbaseAccountSchema = mongoose.Schema({
    apiKey: String,
    secret: String
}, {strict: false})

module.exports = mongoose.model('coinbaseAccounts', coinbaseAccountSchema)