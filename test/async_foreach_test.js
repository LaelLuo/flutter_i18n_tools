const assert = require('assert')

describe('ForEach Test', () => {
    it('async', async () => {
        let list = [1, 2, 3]
        let result = 0
        let promiseList = []
        list.forEach((value) => {
            promiseList.push(new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
                result += value
            }))
        });
        await Promise.all(promiseList);
        assert(result == 6, `real value is ${result}`)
    });
})