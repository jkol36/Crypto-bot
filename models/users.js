const mongoose = require('mongoose')


const userSchema = mongoose.Schema({}, {strict: false})

module.exports = mongoose.model('users', userSchema)