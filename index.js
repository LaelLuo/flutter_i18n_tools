#! /usr/bin/env node
/** 
 * 需要参数
 * src 资源文件见
 * dist 生成目录
 * */
const
    fs = require('fs'),
    path = require('path'),
    http = require('http'),
    debug = true,
    print = (obj) => { debug ? console.log(obj) : null },
    args = process.argv.slice(2),
    src = path.resolve(args[0]),
    dist = path.resolve(args[1]),
    reg = /"[\u4e00-\u9fa5]+"/gm,
    map = new Map()

print(`src path: ${src}`)
print(`dist path: ${dist}`)

if (!fs.existsSync(dist)) {
    print('dist dir not exit')
    fs.mkdirSync(dist)
    print('dist dir created')
}

start()

function translate(word) {
    return new Promise((resolve, reject) => {
        http.get(`http://fy.iciba.com/ajax.php?a=fy&f=zh&t=en&w=${word}`, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                let result = JSON.parse(data).content.out.replace(/[^a-zA-Z ]/g, '');
                resolve(result)
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            reject(err)
        });
    })
}

function camelCase(word) {
    let result = ''
    word = word.trim()
    word.toLowerCase().split(' ').forEach((sub) => {
        if (sub == '') {
            return
        }
        result += sub[0].toUpperCase() + sub.substr(1)
    })
    result = result[0].toLowerCase() + result.substr(1)
    return result
}

/**
 * 需要读取文件
 * 匹配"[\u4e00-\u9fa5]+"
 * 如果匹配数量不为0 则添加improt语句
 * import 'package:vidy_app/generated/i18n.dart';
 * 获取文本
 * 翻译为英语
 * 接口http://fy.iciba.com/ajax.php?a=fy&f=auto&t=auto&w=代码
 * 转驼峰
 * 得到key
 * 如果map[key] == null
 * map[key] = 源文本
 * 否则
 * 判断map[key] == 源文本
 * 是 则
 * 源文本替换为
 * S.of(context).$key
 * 否 则key = $key
 * */
async function start() {
    await recursiveFile(src, async (filePath, file) => {
        print(`reading file: ${filePath}`)
        let data = file.toString()
        let result
        let lastIndex
        if (reg.test(data)) {
            print('add import')
            data = addImport(data);
        }
        while (lastIndex != 0) {
            result = reg.exec(data)
            lastIndex = reg.lastIndex
            if (result != null) {
                print(`result: ${result}`)
                data = await processing(data, result[0], result.index)
            }
        }
        // print(data)
        fs.writeFileSync(filePath, data)
    })
    map.forEach((value, key) => print(`${key}:${value}`))
    let obj = Object.create(null);
    for (let [k, v] of map) {
        obj[k] = v;
    }
    fs.writeFileSync(path.resolve(dist, 'arb.arb'), JSON.stringify(obj))
}

function addImport(data) {
    return "import 'package:vidy_app/generated/i18n.dart';\n" + data
}

function addMap(key, value) {
    if (map[key] != value && map[key] != null) {
        key = `${key}2`
        return addMap(key, value)
    }
    map.set(key, value)
    return key
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function processing(data, word, index) {
    let value = word.substr(1, word.length - 2)
    let key = word.substr(1, word.length - 2)
    try {
        await sleep(500)
        key = await translate(key)
    } catch (error) {
    }
    print(key)
    key = camelCase(key)
    key = addMap(key, value)
    return data.replace(word, `S.of(context).${key}`)
}

async function recursiveFile(filePath, callback) {
    let state = fs.statSync(filePath)
    let isDir = state.isDirectory()
    if (isDir) {
        let files = fs.readdirSync(filePath)
        print(`${filePath}: [${files.toLocaleString()}]`)
        for (let i = 0; i < files.length; i++) {
            let fileName = files[i]
            await recursiveFile(path.join(filePath, fileName), callback)
        }
    } else {
        print(filePath)
        if (typeof callback === "function" && path.parse(filePath).ext == '.dart') {
            await callback(filePath, fs.readFileSync(filePath))
        } else {
            print(callback)
        }
    }
}