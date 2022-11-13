const mongoose = require('mongoose')

const fileSchema = mongoose.Schema({
    file_sha: String
}, {strict: false})

module.exports =  mongoose.model('files', fileSchema)

