import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    name: String
})

export default mongoose.model('topics', topicSchema)