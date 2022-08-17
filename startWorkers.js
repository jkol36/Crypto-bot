const { Worker } = require('worker_threads')

const runService = (WorkerData) => {
    console.log('running service', WorkerData)
    return new Promise((resolve, reject) => {
    
        // import workerExample.js script..
    
        const worker = new Worker('./index.js', { WorkerData });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`stopped with  ${code} exit code`));
        })
    })
}

const run = async () => {
    const result = await runService('hello John Doe')
    console.log(result);
}

run().catch(err => console.error(err))