const test = require('tape')

const parse = require('../../parse').element('Guard')

test('X === 5 |', function (t) {
  const res = parse('X === 5 |')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('X===5|', function (t) {
  const res = parse('X===5|')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('true |', function (t) {
  const res = parse('true |')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 1)

  t.end()
})

test('f(X), g(Y) |', function (t) {
  const res = parse('f(X), g(Y) |')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('f([1,2]), X = { a: 2, b: 4 } |', function (t) {
  const res = parse('f([1,2]), X = { a: 2, b: 4 } |')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})

test('${0}, ${1} |', function (t) { // eslint-disable-line no-template-curly-in-string
  const res = parse('${0}, ${1} |') // eslint-disable-line no-template-curly-in-string

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)

  t.equal(res.length, 2)

  t.end()
})
