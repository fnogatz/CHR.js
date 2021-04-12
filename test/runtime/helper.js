const test = require('tape')

const Helper = require('../../runtime').Helper

test('Runtime.Helper.allDifferent', function (t) {
  t.ok(typeof Helper.allDifferent === 'function')

  t.ok(Helper.allDifferent([1, 2, 3]))
  t.ok(Helper.allDifferent([1, 2, 'a']))
  t.ok(Helper.allDifferent(['a', 'b', 'c']))
  t.ok(Helper.allDifferent([1]))

  t.notOk(Helper.allDifferent([1, 2, 3, 1]))
  t.notOk(Helper.allDifferent([1, 1, 2, 3]))
  t.notOk(Helper.allDifferent([1, 1]))

  t.end()
})

test('Runtime.Helper.forEach', function (t) {
  t.ok(typeof Helper.forEach === 'function')

  t.test('Single single-element array', function (t) {
    const input = [['3']]

    const res = []
    Helper.forEach(input, function (ids, callback) {
      res.push(ids)
      callback()
    }, function () {
      t.deepEqual(res, input)

      t.end()
    })
  })

  t.test('Runtime.Helper.forEach([[3,1,4],[9],[5,6],[8,2,7]])', function (t) {
    const input = [['3', '1', '4'], ['9'], ['5', '6'], ['8', '2', '7']]
    const expected = [
      ['3', '9', '5', '8'],
      ['3', '9', '5', '2'],
      ['3', '9', '5', '7'],
      ['3', '9', '6', '8'],
      ['3', '9', '6', '2'],
      ['3', '9', '6', '7'],
      ['1', '9', '5', '8'],
      ['1', '9', '5', '2'],
      ['1', '9', '5', '7'],
      ['1', '9', '6', '8'],
      ['1', '9', '6', '2'],
      ['1', '9', '6', '7'],
      ['4', '9', '5', '8'],
      ['4', '9', '5', '2'],
      ['4', '9', '5', '7'],
      ['4', '9', '6', '8'],
      ['4', '9', '6', '2'],
      ['4', '9', '6', '7']
    ]

    const res = []
    Helper.forEach(input, function (ids, callback) {
      res.push(ids)
      callback()
    }, function () {
      t.deepEqual(res, expected)

      t.end()
    })
  })

  t.test('Avoids duplicates', function (t) {
    const input = [['3', '1', '4'], ['1'], ['5', '9'], ['2', '6', '5', '4']]
    const expected = [
      ['3', '1', '5', '2'],
      ['3', '1', '5', '6'],
      ['3', '1', '5', '4'],
      ['3', '1', '9', '2'],
      ['3', '1', '9', '6'],
      ['3', '1', '9', '5'],
      ['3', '1', '9', '4'],
      ['4', '1', '5', '2'],
      ['4', '1', '5', '6'],
      ['4', '1', '9', '2'],
      ['4', '1', '9', '6'],
      ['4', '1', '9', '5']
    ]

    const res = []
    Helper.forEach(input, function (ids, callback) {
      res.push(ids)
      callback()
    }, function () {
      t.deepEqual(res, expected)

      t.end()
    })
  })

  t.test('Not for identical IDs I', function (t) {
    const input = [['1'], ['1', '2']]
    const expected = [
      ['1', '2']
    ]

    const res = []
    Helper.forEach(input, function (ids, callback) {
      res.push(ids)
      callback()
    }, function () {
      t.deepEqual(res, expected)

      t.end()
    })
  })

  t.test('Not for identical IDs II', function (t) {
    const input = [[1], ['1', '2']]
    const expected = [
      ['1', '2']
    ]

    const res = []
    Helper.forEach(input, function (ids, callback) {
      res.push(ids)
      callback()
    }, function () {
      t.deepEqual(res, expected)

      t.end()
    })
  })

  t.test('No-op for empty sub-array', function (t) {
    const input = [[1, 2], []]
    let called = false

    t.notOk(called, 'not yet called')

    Helper.forEach(input, function (ids, callback) {
      called = true
      callback()
    }, function () {
      t.notOk(called, 'not called at all')

      t.end()
    })
  })

  t.end()
})
