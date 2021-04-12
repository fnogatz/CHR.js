const test = require('tape')

const parse = require('../parse')

test('chr/parse', function (t) {
  t.equal(typeof parse, 'function')

  t.test('Parse program', function (t) {
    const res = parse('a ==> b')

    t.equal(res.type, 'Program')
    t.equal(res.body.length, 1)

    t.end()
  })

  t.test('Parse element', function (t) {
    const res = parse('a(3)', 'Constraint')

    t.equal(res.type, 'Constraint')

    t.end()
  })

  t.end()
})

test('chr/parse element', function (t) {
  t.equal(typeof parse.element, 'function')

  t.test('Parse Constraint', function (t) {
    const parseConstraint = parse.element('Constraint')

    t.equal(typeof parseConstraint, 'function')

    const res = parseConstraint('a(3)')
    t.equal(res.type, 'Constraint')

    t.end()
  })

  t.end()
})
