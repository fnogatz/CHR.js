var test = require('tape')

var parse = require('../../parse').element('Program')

test('Multiline program I', function (t) {
  var res = parse([
    'name  @ a ==> b',
    'name2 @ b <=> c'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})

test('Multiline program II', function (t) {
  var res = parse([
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
  var res = parse([
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
  var res = parse([
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
  var res = parse([
    'name  @ a ==> b;',
    'name2 @ b <=> c;'
  ].join('\n'))

  t.equal(typeof res, 'object')
  t.equal(res.type, 'Program')
  t.equal(res.body.length, 2)

  t.end()
})
