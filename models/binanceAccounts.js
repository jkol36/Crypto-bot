import mongoose from 'mongoose';

const binanceAccountSchema = mongoose.Schema({
    token: String,
    secret: String,
    cryptos: Array 
}, {strict: false})

export default mongoose.model('binanceAccounts', binanceAccountSchema)