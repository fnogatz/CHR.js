const test = require('tape')

const Runtime = require('../../runtime')

test('Runtime.Store', function (t) {
  t.ok(typeof Runtime.Store === 'function')

  t.end()
})

test('Runtime.History', function (t) {
  t.ok(typeof Runtime.History === 'function')

  t.end()
})

test('Runtime.Constraint', function (t) {
  t.ok(typeof Runtime.Constraint === 'function')

  t.end()
})
