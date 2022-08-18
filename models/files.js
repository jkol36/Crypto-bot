const mongoose = require('mongoose')

const fileSchema = mongoose.Schema({
    path: String,
    mode: String,
    type: String,
    sha: String,
    url: String,
    size: Number,
    isCheckedForSecrets: Boolean
})

module.exports =  mongoose.model('files', fileSchema)

