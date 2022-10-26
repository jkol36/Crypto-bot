
const { expose } = require('threads/worker')


const unique = array => {
    return array.filter((a, b) => array.indexOf(a) ===b)
  }
const clean = string => {
    return string
        .replace(/\s/g, "")
        .replace(/['"]+/g, '')
        .replace(/['']+/g, '')
        .replace(/['=']+/g, '')
        .replace(/[':']+/g, '')
        .replace(/['//']+/g, '')
  }
const initCodeSnippets = () => {
    const codeSnippets = ['const', 'let', 'def', 'module.exports'] // these are variable name variations ive seen out in the wild people are using when naming their api key variables.
                              // I'm using these as a way to identify api keys in peoples code
    return codeSnippets
}



expose(function parseForCodeSnippets(data) {
    const codeSnippetPrefixes = initCodeSnippets()
    const initialHits = codeSnippetPrefixes.map(prefix => ({match: data.match(prefix, 'g'), prefix}))
    //console.log(initialHits.filter(item => item.match !== null))
    let snippets
    try {
        snippets = initialHits.filter(hit => hit.match !== null).map(result => {

            const {match, prefix} = result
            const indexOfMatch = match['index']
            const input = match['input']
            let keyStringInitial = input.substring(indexOfMatch, indexOfMatch+18)
            console.log(keyStringInitial)
            return keyStringInitial
            
           
        
        })
    }
    catch(err){
        console.log('error with snppets', err)
    }
   
    return Promise.resolve(snippets)
})
 