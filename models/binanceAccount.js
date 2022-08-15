import mongoose from 'mongoose';

const binanceAccountSchema = mongoose.Schema({
    token: String,
    secret: String,
    cryptos: Array 
})

export default mongoose.model('binanceAccounts', binanceAccountSchema)