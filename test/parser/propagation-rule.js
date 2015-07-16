var test = require('tape')

var parse = require('../../parse').element('PropagationRule')

test('a ==> b', function (t) {
  var res = parse('a ==> b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'PropagationRule')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 1)

  t.end()
})

test('a==>b', function (t) {
  var res = parse('a==>b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'PropagationRule')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 1)

  t.end()
})

test('a ==> b, c', function (t) {
  var res = parse('a ==> b, c')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 2)

  t.end()
})

test('a, b ==> c', function (t) {
  var res = parse('a, b ==> c')

  t.equal(res.kept.length, 2)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 1)

  t.end()
})

test('a ==> X < 4 | c', function (t) {
  var res = parse('a ==> X < 4 | c')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 1)

  t.equal(res.guard.length, 1)

  t.end()
})

test('a ==> X < 4, X > 0 | c', function (t) {
  var res = parse('a ==> X < 4, X > 0 | c')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 0)
  t.equal(res.body.length, 1)

  t.equal(res.guard.length, 2)

  t.end()
})
