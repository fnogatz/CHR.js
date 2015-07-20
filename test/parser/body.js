var test = require('tape')

var parse = require('../../parse').element('Body')

test('b(N+1,N+2)', function (t) {
  var res = parse('b(N+1,N+2)')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 1)

  t.end()
})

test('b(N+1,N+2), c(N-1)', function (t) {
  var res = parse('b(N+1,N+2), c(N-1)')

  t.equal(typeof res, 'object')
  t.ok(res instanceof Array)
  t.equal(res.length, 2)

  t.end()
})
