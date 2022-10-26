const mongoose = require('mongoose')

const fileSchema = mongoose.Schema({
}, {strict: false})

module.exports =  mongoose.model('files', fileSchema)

