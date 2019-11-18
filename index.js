#! /usr/bin/env node

const
    fs = require('fs'),
    path = require('path'),
    utils = require('./src/common_utils'),
    print = utils.print(true),
    args = utils.getArgs(process),
    src = path.resolve(args.src),
    dist = path.resolve(args.dist),
    type = args.type

print(`src: ${src}\ndisr: ${dist}`)

switch (type) {
    case "arb":
        takeArb()
        break
    case "dart":
        createDart()
        break
    default:
        break
}

function takeArb() {
    let arb = {}
    let importString = 'import \'package:opf_business/generated/app_localizations.dart\';\n'
    let catchRregexp = /r['"](.*)['"]/g
    let replace = 'AppLocalizations.of(context).'
    utils.walk(src, (filePath, data) => {
        print(filePath)
        if (filePath.endsWith('dart')) {
            let result, lastIndex
            if (catchRregexp.test(data)) { data = importString + data }
            catchRregexp.lastIndex = 0
            while (lastIndex != 0) {
                result = catchRregexp.exec(data)
                lastIndex = catchRregexp.lastIndex
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
        }
    })
    utils.save(path.join(dist, `zh_${Date.now()}.arb`), JSON.stringify(arb, null, '\t'))
}

function createDart() {
    let arb = {}
    let localeString = ""
    let loadString = ""
    let classString = ""
    let getString = ""
    let dirParh = path.join(src)
    let paramsRegexp = /\$\{([^\}]*)\}/
    fs.readdirSync(dirParh).forEach((fileName) => {
        if (fileName.endsWith('arb')) {
            arb[fileName.substr(0, 2)] = JSON.parse(fs.readFileSync(path.join(dirParh, fileName)).toString())
        }
    })
    Object.keys(arb).forEach((langCode) => {
        localeString += `\nLocale("${langCode}", ""),\n`
        loadString += `case "${langCode}":\nAppLocalizations.current = const $${langCode}();\nreturn SynchronousFuture<AppLocalizations>(AppLocalizations.current);`
        if (langCode == 'zh') {
            let zh = arb[langCode];
            Object.keys(zh).forEach((key) => {
                let value = zh[key]
                if (/\$\{.*\}/.test(value)) {
                    let lastIndex, params = []
                    while (lastIndex != 0) {
                        params.push(`String ${paramsRegexp.exec(value)[1]}`)
                        lastIndex = paramsRegexp.lastIndex
                    }
                    getString += `\n  String ${key}(${params.join(',')}) => "${value}";\n`
                } else {
                    getString += `\n  String get ${key} => "${value}";\n`
                }
            })
            classString += `class $${langCode} extends AppLocalizations {\nconst $${langCode}();\n}\n`
        } else {
            let overrideString = ""
            let lang = arb[langCode];
            Object.keys(lang).forEach((key) => {
                let value = lang[key]
                if (/\$\{.*\}/.test(value)) {
                    let lastIndex, params = []
                    while (lastIndex != 0) {
                        params.push(`String ${paramsRegexp.exec(value)[1]}`)
                        lastIndex = paramsRegexp.lastIndex
                    }
                    overrideString += `\n@override\n  String ${key}(${params.join(',')}) => "${value}";\n`
                } else {
                    overrideString += `\n@override\n  String get ${key} => "${value}";\n`
                }
            })
            classString += `class $${langCode} extends AppLocalizations {\nconst $${langCode}();\n${overrideString}}\n`
        }
    })
    utils.save(path.join(dist, 'app_localizations.dart'),
        fs.readFileSync('./data/app_localizations.dart.temp')
            .toString()
            .replace('@locale', localeString)
            .replace('@load', loadString)
            .replace('@class', classString)
            .replace('@get', getString)
    )
}