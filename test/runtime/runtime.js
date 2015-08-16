var test = require('tape')

var Runtime = require('../../runtime')

test('Runtime.Store', function (t) {
  t.ok(Runtime.hasOwnProperty('Store'))

  t.end()
})

test('Runtime.History', function (t) {
  t.ok(Runtime.hasOwnProperty('History'))

  t.end()
})

test('Runtime.Constraint', function (t) {
  t.ok(Runtime.hasOwnProperty('Constraint'))

  t.end()
})
