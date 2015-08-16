var test = require('tape')

var Constraint = require('../../src/constraint')

test('Creation', function (t) {
  t.test('Arity: 2', function (t) {
    var c = new Constraint('con', 2, ['a', 'b'])

    t.equal(c.name, 'con')
    t.equal(c.arity, 2)
    t.deepEqual(c.args, ['a', 'b'])

    t.end()
  })

  t.test('Arity: 0', function (t) {
    var c = new Constraint('a', 0)

    t.equal(c.name, 'a')
    t.equal(c.arity, 0)
    t.notOk(c.args)

    t.end()
  })

  t.end()
})

test('Constraint.toString()', function (t) {
  t.test('Arity: 2', function (t) {
    var c = new Constraint('con', 2, ['a', 'b'])

    t.equal(c.toString(), 'con("a","b")')

    t.end()
  })

  t.test('Arity: 0', function (t) {
    var c = new Constraint('con', 0)

    t.equal(c.toString(), 'con')

    t.end()
  })

  t.end()
})
