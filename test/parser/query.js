const test = require('tape')

const parse = require('../../parse').element('Query')

test('a', function (t) {
  const res = parse('a')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('a,b', function (t) {
  const res = parse('a,b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('a b', function (t) {
  const res = parse('a b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('  a   b ', function (t) {
  const res = parse('  a   b ')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('a, b', function (t) {
  const res = parse('a, b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('a(1,2), b', function (t) {
  const res = parse('a(1,2), b')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('ab', function (t) {
  const res = parse('ab')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('ab c ,d', function (t) {
  const res = parse('ab c ,d')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 3)

  t.end()
})

test('a,b,', function (t) {
  const res = parse('a,b,')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 2)

  t.equal(typeof res[0], 'object')
  t.equal(typeof res[1], 'object')

  t.equal(res[0].type, 'Constraint')
  t.equal(res[1].type, 'Constraint')

  t.end()
})

test('Array as argument', function (t) {
  const res = parse('a([1,2,3])')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('Object as argument', function (t) {
  const res = parse('a({ a: 1, b: 2, "c": 3 })')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('String as argument, single quotation marks', function (t) {
  const res = parse("a('1,2,3')")

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('String as argument, doule quotation marks', function (t) {
  const res = parse('a("1,2,3")')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('Identifier as argument', function (t) {
  const res = parse('a(fire)')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('Function as argument', function (t) {
  const res = parse('a(function() {})')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('Negative number as argument', function (t) {
  const res = parse('a(-1)')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})
