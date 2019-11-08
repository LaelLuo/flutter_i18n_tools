/**
 * 读取arb -> a {key:string}
 * 读取lan/*.js -> b {key1:{key2:string}} -> c {string:[key1.key2]} 保存为文件
 * 遍历a {key:string}的值 在c {string:[key1.key2]}作为key查询 得到key1.key2
 * 通过得到的结果 在b {key1:{key2:string}}里找到对应的值替换到a {key:string}上
 * 保存a为到lan/*.arb
 */

const
    fs = require('fs'),
    path = require('path'),
    utils = require('../src/common_utils'),
    cn = require('../data/lan/cn').cn,
    en = require('../data/lan/en').en,
    jp = require('../data/lan/jp').jp,
    ko = require('../data/lan/ko').ko,
    lan = { en, jp, ko },
    print = utils.print(true)

main()

function main() {
    Object.keys(lan).forEach((key) => saveLanA(key, lan[key]))
}

function saveLanA(lanCode, lanB) {
    let cnC = b2C(cn)
    let arb = readArb()
    let date = new Date()
    forEachObject(null, readArb(), (key, value) => {
        print(key)
        let cnCValue = cnC[value]
        if (cnCValue != null && getProperty(cnCValue[0], lanB) != null) {
            arb[key] = getProperty(cnCValue[0], lanB)
        }
    })
    save('./data/dist/lan_arb', `arb_${lanCode}_${date.getFullYear()}${date.getMonth() + 1}${(date.getDate() + '').length != 2 ? '0' + date.getDate() : date.getDate()}.arb`, arb)
}

function getProperty(key, object) {
    let result = object
    key.split('.').forEach((realKey) => {
        result = result[realKey]
    })
    return result
}

function readArb() {
    let a = JSON.parse(fs.readFileSync('./data/dist/arb_zh_20191107.arb').toString())
    return a
}

function forEachObject(preKey, object, callback) {
    Object.keys(object).forEach((key) => {
        if (typeof object[key] == 'object') {
            forEachObject(preKey == null ? key : `${preKey}.${key}`, object[key], callback)
        } else {
            callback(preKey == null ? key : `${preKey}.${key}`, object[key])
        }
    })
}

function b2C(lanObject) {
    let object = {}
    forEachObject(null, lanObject, (key, value) => {
        if (object[value] == null) {
            object[value] = []
        }
        object[value].push(key)
    })
    return object
}

function forEachC(callback) {
    Object.keys(lan).forEach((key) => {
        callback(key, b2C(lan[key]))
    })
}

function save(path, fileName, data) {
    fs.writeFileSync(`${path}/${fileName}`, JSON.stringify(data, null, '\t'))
}

