var test = require('tape')

var parse = require('../../parse').element('Rule')

test('name @ a ==> b', function (t) {
  var res = parse('name @ a ==> b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'PropagationRule')
  t.equal(res.name, 'name')

  t.end()
})
test('name @ a <=> b', function (t) {
  var res = parse('name @ a <=> b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimplificationRule')
  t.equal(res.name, 'name')

  t.end()
})
