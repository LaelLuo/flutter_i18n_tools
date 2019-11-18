#! /usr/bin/env node
/** 
 * 需要参数
 * src 资源文件夹
 * dist 生成目录
 * */
const
    fs = require('fs'),
    path = require('path'),
    utils = require('../src/common_utils'),
    print = utils.print(true),
    args = utils.getArgs(process.argv.slice(2)),
    src = path.resolve(args.src),
    dist = path.resolve(args.dist),
    reg = /[^r]["'][\u4e00-\u9fa5，！。 ]+["']/gm,
    map = {}

print(`src path: ${src}`)
print(`dist path: ${dist}`)

if (!fs.existsSync(dist)) {
    print('dist dir not exit')
    fs.mkdirSync(dist)
    print('dist dir created')
}

start(src, dist)

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
 * 源文本替换为
 * S.of(context).$key
 * 并保存key:源文本
 * 最后输出arb文件
 * */
async function start(src, dist) {
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
        fs.writeFileSync(filePath, data)
    })
    fs.writeFileSync(path.resolve(dist, 'arb.arb'), JSON.stringify(map, null, '\t'))
}

function addImport(data) {
    return "import 'package:vidy_app/generated/i18n.dart';\n" + data
}

function addMap(key, value) {
    if (map[key] != value && map[key] != null) {
        key = `${key}2`
        return addMap(key, value)
    }
    map[key] = value
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
        key = await utils.translate(key)
    } catch (error) {
    }
    print(key)
    key = utils.camelCase(key)
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
            print(`skip\ntypeof callback: ${typeof callback}\npath.parse(filePath).ext: ${path.parse(filePath).ext}\n`)
        }
    }
}