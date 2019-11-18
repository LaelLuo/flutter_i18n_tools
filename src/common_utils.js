const
    http = require('http'),
    fs = require('fs'),
    path = require('path')

module.exports.print = (debug) => debug ? console.log : null
module.exports.mapToObject = (map) => {
    let object = {}
    for (let [k, v] of map) {
        object[k] = v;
    }
    return object
}
/**
 * @param {NodeJS.Process} raw
 */
module.exports.getArgs = (raw) => {
    const object = {}
    raw = raw.argv.slice(2)
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

module.exports.walk = walk

/**
 * 遍历文件夹
 * @param {string} filePath
 * @param {(path:string,data:string)=>string} callback
 */
function walk(filePath, callback) {
    if (fs.statSync(filePath).isDirectory()) {
        let files = fs.readdirSync(filePath)
        for (let i = 0; i < files.length; i++) {
            let fileName = files[i]
            walk(path.join(filePath, fileName), callback)
        }
    } else {
        if (typeof callback === "function") {
            callback(filePath, fs.readFileSync(filePath).toString())
        }
    }
}

module.exports.analyze = analyze
/**
 * 解析`key@value`
 * @param {string} data
 * @param {(result:Object)=>void} callback
 */
function analyze(data, callback) {
    let index = data.indexOf('@'),
        key = data.slice(0, index),
        value = data.slice(index + 1, data.length),
        reg = /\$\{(\w+@[^\}]*)\}/g,
        result, lastIndex

    if (reg.test(value)) {
        let object = { key, params: {} }
        reg.lastIndex = 0
        while (lastIndex != 0) {
            result = reg.exec(value)
            lastIndex = reg.lastIndex
            if (result != null && result[0].length != 0) {
                let split = result[1].split('@')
                object.params[split[0]] = split[1]
                value = value.replace(result[1], split[0])
            }
        }
        object.value = value
        callback(object)
    } else {
        callback({
            key,
            value
        })
    }
}
/**
 * @param {string} filePath 
 * @param {string} data 
 */
module.exports.save = (filePath,data)=>{
    let pathObj = path.parse(filePath)
    if(!fs.existsSync(pathObj.dir)){
        fs.mkdirSync(pathObj.dir)
    }
    fs.writeFileSync(filePath,data)
}