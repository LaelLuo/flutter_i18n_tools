const
    utils = require('../src/common_utils'),
    assert = require('assert')

describe('common_utils 测试:', () => {
    describe('print', () => {
        it('debug模式', () => {
            let print = utils.print(true)
            assert(print == console.log)
        })
        it('关闭debug', () => {
            let print = utils.print(false)
            assert(print == null, `print: ${print}`)
        })
    })
    describe('camelCase', () => {
        it('首字母大写', () => {
            let result = utils.camelCase('ab cd de', true)
            assert(result == 'AbCdDe', `result: ${result}`)
        })
        it('首字母小写', () => {
            let result = utils.camelCase('ab cd de')
            assert(result == 'abCdDe', `result: ${result}`)
        })
    })
    describe('translate', () => {
        it('中->英', async () => {
            assert(await utils.translate('代码') == 'code')
        })
    })
    describe('getArgs', () => {
        it('读取属性', () => {
            let args = utils.getArgs(['src=a', 'dist=sa'])
            assert(args.src == 'a' && args.dist == 'sa')
            assert(args.src != 'sa' && args.dist != 'a')
        })
    })
})
