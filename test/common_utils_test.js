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
    describe('walk', () => {
        let print = utils.print(true)
        it('sync', () => {
            let result = ''
            utils.walk('./data', (filePath, data) => {
                result = filePath
            })
            assert(result == 'data\\test.dart')
        })
    })
    describe('analyze', () => {
        it('key@value', () => {
            utils.analyze('a@b', (result) => {
                assert(result.key == 'a', result.key)
                assert(result.value == 'b', result.value)
            })
        })
        it('key@value${}', () => {
            utils.analyze('a@b${c@d}b', (result) => {
                assert(result.key == 'a', result.key)
                assert(result.value == 'b${c}b', `value ${result.value}`)
                assert(result.params.c == 'd', result.params)
            })
        })
    })
})
