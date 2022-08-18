const mongoose = require('mongoose')

const folderSchema = mongoose.Schema({
  path: String,
  mode: String,
  type: String,
  sha: String,
  url: String
})

module.exports = mongoose.model('folders', folderSchema)