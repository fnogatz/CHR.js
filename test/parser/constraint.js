var test = require('tape')

var parse = require('../../parse').element('Constraint')

test('a', function (t) {
  var res = parse('a')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Constraint')
  t.equal(res.name, 'a')
  t.deepEqual(res.parameters, [])

  t.end()
})

test('a(1)', function (t) {
  var res = parse('a(1)')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Constraint')
  t.equal(res.name, 'a')

  t.equal(res.parameters.length, 1)

  t.end()
})

test('a(1,2)', function (t) {
  var res = parse('a(1,2)')

  t.equal(res.parameters.length, 2)

  t.end()
})

test('a(1, 2)', function (t) {
  var res = parse('a(1, 2)')

  t.equal(res.parameters.length, 2)

  t.end()
})

test('a("1")', function (t) {
  var res = parse('a("1")')

  t.equal(res.parameters.length, 1)

  t.end()
})
