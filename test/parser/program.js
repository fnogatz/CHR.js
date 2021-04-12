const test = require('tape')

const parse = require('../../parse').element('Program')

test('Multiline program I', function (t) {
  const res = parse([
    'name  @ a ==> b',
    'name2 @ b <=> c'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})

test('Multiline program II', function (t) {
  const res = parse([
    '',
    'name  @ a ==> b',
    'name2 @ b <=> c'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})

test('Multiline program III', function (t) {
  const res = parse([
    '',
    'name  @ a ==> b',
    '',
    'name2 @ b <=> c'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})

test('Multiline program IV', function (t) {
  const res = parse([
    '',
    'name  @ a ==> b',
    '',
    'name2 @ b <=> c',
    ''
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})

test('Multiline program V', function (t) {
  const res = parse([
    'name  @ a ==> b;',
    'name2 @ b <=> c;'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})
