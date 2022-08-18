const mongoose = require('mongoose')

const stripeKeySchema = mongoose.Schema({
    token: String,
    isLive: Boolean
})

module.exports =  mongoose.model('stripeKeys', stripeKeySchema)