import { makeOctokitRequest } from './middlewares';
import  { Octokit } from '@octokit/rest';
const Sentry = require('@sentry/node')


Sentry.init({
    dsn: "https://1ff02f3dcce144aaaaa7b424918555f8@o1362299.ingest.sentry.io/6653686",
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

class GitHubRepoParser {
    constructor(octokit) {
        this.GITHUB_API_KEY = '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';
        this.octokit = octokit
    }

    getContentsUrl = async (pathsUrl) => {
        return await this.octokit.request(`GET ${pathsUrl}`, {
            owner: this.owner,
            repo: this.repo,
            tree_sha: this.GITHUB_API_KEY
        })
        .then(res => res.data).catch(err => {
            console.log(err)
        })
    }

    gatherRawUrls = async (listOfFiles, level) => {
       //console.log('gathering', listOfFiles.length, ++level)
        try {
            listOfFiles.map(file => {
                try {
                    const dotIndex = file.download_url ? file.download_url.lastIndexOf('.') + 1 : file.download_url
                    let extension;
                    if (file.type === 'file') {
                        file.download_url.substring(dotIndex,).includes('/') ? extension = 'Miscellaneous' : extension = file.download_url.substring(dotIndex,)
                        this.rawUrls[extension]   // if key exists in dictionary
                            ?
                            this.rawUrls[extension].push(file.download_url)
                            :
                            this.rawUrls[extension] = [file.download_url]
                    }
                }
                catch(err) {
                    console.log(err)
                }
            })
        }
        catch(err) {
            console.log(err)
        }
        if (listOfFiles.filter(file => file.type === 'dir').length === 0) {
            return;
        } else {
            for (const dir of listOfFiles
                .filter(file => file.type === 'dir')) {
                await this.gatherRawUrls(await this.getContentsUrl(dir.url), level).catch(err => Sentry.captureException(err))
            }
        }
    }

    initializeRepoDetails = (url) => {
        this.rawUrls = {};
        this.url = url;
        this.owner = url.split('https://github.com/')[1].split('/')[0];
        this.repo = url.split('https://github.com/')[1].split('/')[1];
    }

    collectData = async (url) => {
        await this.initializeRepoDetails(url)
        await this.octokit.request(`GET /repos/${this.url.split('https://github.com/')[1]}`, {
            owner: this.owner,
            repo: this.repo,
            tree_sha: this.GITHUB_API_KEY
        })
            .then(res => this.getContentsUrl(res.data.contents_url.split('{+path}')[0]))
            .then(async listOfFiles => await this.gatherRawUrls(listOfFiles, 0))
            .catch(e => Sentry.captureException(e));
        return this.rawUrls;
    }
}

module.exports = GitHubRepoParser