var test = require('tape')

var parse = require('../../parse').element('Query')

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

test('a b', function (t) {
  var res = parse('a b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('  a   b ', function (t) {
  var res = parse('  a   b ')

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

test('ab', function (t) {
  var res = parse('ab')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('ab c ,d', function (t) {
  var res = parse('ab c ,d')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 3)

  t.end()
})

test('a,b,', function (t) {
  var res = parse('a,b,')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 2)

  t.equal(typeof res[0], 'object')
  t.equal(typeof res[1], 'object')

  t.equal(res[0].type, 'Constraint')
  t.equal(res[1].type, 'Constraint')

  t.end()
})
