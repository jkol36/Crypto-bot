const mongoose = require('mongoose')

const depositAddressSchema = mongoose.Schema({}, {strict: false})

module.exports =  mongoose.model('depositAddresses', depositAddressSchema)