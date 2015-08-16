var test = require('tape')

var Store = require('../../src/store')
var Constraint = require('../../src/constraint')

test('Creation', function (t) {
  var s = new Store()

  t.ok(s)

  t.end()
})

test('Add/Remove', function (t) {
  var s = new Store()
  var c = new Constraint('a', 0)

  var id = s.add(c)

  t.ok(id !== undefined)
  t.equal(s.length, 1)

  s.kill(id)
  t.equal(s.length, 0)

  t.end()
})

test('Event Listeners', function (t) {
  var s = new Store()
  var c = new Constraint('a', 0)

  s.on('add', function (constraint) {
    t.ok(constraint)
    t.equal(constraint.id, c.id)

    t.end()
  })

  s.add(c)
})

test('Store.forEach()', function (t) {
  var s = new Store()

  t.equal(typeof s.forEach, 'function')

  t.end()
})

test('Store.map()', function (t) {
  var s = new Store()

  var expected = [
    'a(1)',
    'b(2,3)',
    'a',
    'a',
    'c(1)'
  ]
  s.add(new Constraint('a', 1, [1]))
  s.add(new Constraint('b', 2, [2, 3]))
  s.add(new Constraint('a', 0))
  s.add(new Constraint('a', 0))
  s.add(new Constraint('c', 1, [1]))

  var res = s.map(function (c) {
    return c.toString()
  })

  t.deepEqual(res, expected)

  t.end()
})
