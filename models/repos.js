import mongoose from 'mongoose';


const repoSchema = mongoose.Schema({
  name: String,
  full_name: String,
  owner: Object
}, {strict: false})

export default  mongoose.model('repos', repoSchema)