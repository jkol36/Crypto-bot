const mongoose = require('mongoose')

const mongoUrlSchema = mongoose.Schema({
    url: String
}, {strict: false})

module.exports =  mongoose.model('mongoUrls', mongoUrlSchema)