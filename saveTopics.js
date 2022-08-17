import models from './models';
import mongoose from 'mongoose';
import { unique } from './helpers';

console.log('running')

mongoose.connect('mongodb+srv://jkol36:TheSavage1990@cluster0.bvjyjf3.mongodb.net/?retryWrites=true&w=majority').then(() => {
    mongoose.model('repos').find({topics:  { $exists: true, $not: {$size: 0} }}).then(repos => {
        let topics = []
        repos.forEach(repo => {
            const { topics } = repo;
            topics.forEach(topic => topics.push(topic))
        })
        const uniqueTopics = unique(topics)
        console.log('got unique topics', uniqueTopics.length)
        const topicObjs = uniqueTopics.map(topic => ({name: topic}))
        console.log('bulk inserting topics')
        console.log('exmaple', topicObjs[0])
        return mongoose.model('topics').bulkWrite(topicObjs).then(res => {
            console.log('saving')
            return res.save()
        }).then(() => console.log('done'))
        // const uniqueTopics = unique()
    
        // let topicObjs = uniqueTopics.map(topic => ({name: topic}))
        // console.log(topicObjs)
        // return mongoose.model('topics').bulkWrite(topicObjs).then(res => {
        //     console.log('got res now saving', res)
        //     return res.save()
        // }).then(() => console.log('finished'))
        

    })
})