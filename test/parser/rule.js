const test = require('tape')

const parse = require('../../parse').element('Rule')

test('name @ a ==> b', function (t) {
  const res = parse('name @ a ==> b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'PropagationRule')
  t.equal(res.name, 'name')

  t.end()
})

test('name @ a <=> b', function (t) {
  const res = parse('name @ a <=> b')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimplificationRule')
  t.equal(res.name, 'name')

  t.end()
})

test('name @ a \\ b <=> c', function (t) {
  const res = parse('name @ a \\ b <=> c')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimpagationRule')
  t.equal(res.name, 'name')

  t.end()
})

test('name @ a / b <=> c', function (t) {
  const res = parse('name @ a / b <=> c')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimpagationRule')
  t.equal(res.name, 'name')

  t.end()
})

test('Set "constraints" property', function (t) {
  const res = parse('name @ a ==> b')

  t.ok(res.constraints)
  t.deepEqual(res.constraints, ['a/0', 'b/0'])

  t.end()
})
