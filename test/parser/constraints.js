var test = require('tape')

var parse = require('../../parse').element('Constraints')

test('a', function (t) {
  var res = parse('a')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('a,b', function (t) {
  var res = parse('a,b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('a, b', function (t) {
  var res = parse('a, b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('a(1,2), b', function (t) {
  var res = parse('a(1,2), b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})
