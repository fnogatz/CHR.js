var test = require('tape')

var parse = require('../../parse').element('Replacement')

test('${0}', function (t) {
  var res = parse('${0}')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Replacement')
  t.equal(res.num, 0)

  t.end()
})

test('${42}', function (t) {
  var res = parse('${42}')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Replacement')
  t.equal(res.num, 42)

  t.end()
})
