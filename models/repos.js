const mongoose = require('mongoose')


const repoSchema = mongoose.Schema({
  name: String,
  full_name: String,
  owner: Object
}, {strict: false})

module.exports = mongoose.model('repos', repoSchema)