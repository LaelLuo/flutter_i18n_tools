#! /usr/bin/env node

const
    fs = require('fs'),
    path = require('path'),
    utils = require('./src/common_utils'),
    print = utils.print(true),
    args = utils.getArgs(process),
    src = path.resolve(args.src),
    dist = path.resolve(args.dist),
    reg = /r['"](.*)['"]/g,
    replace = 'AppLocalizations.of(context).',
    importString = 'import \'package:opf_business/generated/app_localizations.dart\';\n';

function saveArb() {
    let arb = {}
    utils.walk(src, (filePath, data) => {
        print(filePath)
        let result, lastIndex
        if (reg.test(data)) { data = importString + data }
        reg.lastIndex = 0
        while (lastIndex != 0) {
            result = reg.exec(data)
            lastIndex = reg.lastIndex
            if (result != null) {
                utils.analyze(result[1], (analyzeResult) => {
                    while (arb[analyzeResult.key] != null &&
                        arb[analyzeResult.key] != analyzeResult.value) {
                        analyzeResult.key += '$'
                    }
                    let { key, value, params } = analyzeResult,
                        oldString = result[0],
                        hasParams = params == null
                    arb[key] = value
                    // 得到 AppLocalizations.of(context).key 并替换
                    data = data.replace(oldString, `${replace}${key}${hasParams ? '' : `(${Object.values(params)})`}`)
                })
            }
        }
        utils.save(filePath, data)
    })
    utils.save(path.join(dist, 'arb', `zh_${Date.now()}.arb`), JSON.stringify(arb, null, '\t'))
}

(() => {
    let temp = fs.readFileSync('./data/app_localizations.dart.temp').toString()
    saveArb()
})()