import mongoose from 'mongoose'

const folderSchema = mongoose.Schema({
  path: String,
  mode: String,
  type: String,
  sha: String,
  url: String
})

export default mongoose.model('folders', folderSchema)