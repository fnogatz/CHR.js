var test = require('tape')

var parse = require('../../parse').element('Parameter')

test('1', function (t) {
  var res = parse('1')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Literal')
  t.equal(res.value, 1)

  t.end()
})

test('"1"', function (t) {
  var res = parse('"1"')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Literal')
  t.equal(res.value, '1')

  t.end()
})

test('[]', function (t) {
  var res = parse('[]')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'ArrayExpression')
  t.ok(res.elements)
  t.equal(res.elements.length, 0)

  t.end()
})

test('{}', function (t) {
  var res = parse('{}')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'ObjectExpression')
  t.ok(res.properties)
  t.equal(res.properties.length, 0)

  t.end()
})
