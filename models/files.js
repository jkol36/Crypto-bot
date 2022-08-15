import mongoose from 'mongoose';

const fileSchema = mongoose.Schema({
    path: String,
    mode: String,
    type: String,
    sha: String,
    url: String,
    size: Number,
    isCheckedForSecrets: Boolean
})

export default mongoose.model('files', fileSchema)

