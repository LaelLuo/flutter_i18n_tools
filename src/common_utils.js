const
    http = require('http')

module.exports.print = (debug) => debug ? console.log : null
module.exports.mapToObject = (map) => {
    let object = {}
    for (let [k, v] of map) {
        object[k] = v;
    }
    return object
}
module.exports.getArgs = (raw) => {
    const object = {}
    raw.forEach((rawArg) => {
        let split = rawArg.split('=')
        object[split[0]] = split[1]
    })
    return object
}
module.exports.camelCase = (word, capitalization = false) => {
    let result = ''
    word = word.trim()
    word.toLowerCase().split(' ').forEach((sub) => {
        if (sub == '') {
            return
        }
        result += sub[0].toUpperCase() + sub.substr(1)
    })
    if (!capitalization) {
        result = result[0].toLowerCase() + result.substr(1)
    }
    return result
}
/**
 * @param {string} word
 */
module.exports.translate = (word) => {
    return new Promise((resolve, reject) => {
        http.get(`http://fy.iciba.com/ajax.php?a=fy&f=zh&t=en&w=${word}`, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                let result = JSON.parse(data).content.out.replace(/[^a-zA-Z ]/g, '').trim();
                resolve(result)
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err)
        });
    })
}