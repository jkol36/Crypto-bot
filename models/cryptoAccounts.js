import mongoose from 'mongoose';

const cryptoAccountSchema = mongoose.Schema({
    address: String,
    privateKey: String,
    balance: String,
    network: String
})

export default mongoose.model('cryptoAccounts', cryptoAccountSchema)