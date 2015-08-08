var test = require('tape')

var CHR = require('../../src/index')

test('chr.Store', function (t) {
  var chr = new CHR()

  t.equal(typeof chr.Store, 'object', 'chr.Store is object')

  t.end()
})

test('chr.History', function (t) {
  var chr = new CHR()

  t.equal(typeof chr.History, 'object', 'chr.History is object')

  t.end()
})

test('chr.Rules', function (t) {
  var chr = new CHR()

  t.equal(typeof chr.Rules, 'object', 'chr.Rules is object')

  t.end()
})

test('chr.Constraints', function (t) {
  t.test('chr.Constraints is object', function (t) {
    var chr = new CHR()

    t.equal(typeof chr.Constraints, 'object')

    t.end()
  })

  t.test('chr.Constraints saves defined constraints and their occurences', function (t) {
    var chr = new CHR()

    t.deepEqual(chr.Constraints, {}, 'chr.Constraints is initially empty')

    chr('first @ a ==> b, a(1)')

    ;['a/0', 'a/1', 'b/0'].forEach(function (functor) {
      t.ok(chr.Constraints.hasOwnProperty(functor))
      t.equal(typeof chr.Constraints[functor], 'object')
      t.ok(chr.Constraints[functor] instanceof Array)
    })

    t.deepEqual(chr.Constraints['a/0'], [ 'first' ], 'a/0 is only in the head of rule "first"')
    t.deepEqual(chr.Constraints['a/1'], [], 'a/1 is in no rule head')
    t.deepEqual(chr.Constraints['b/0'], [], 'b/0 is in no rule head')

    t.end()
  })

  t.end()
})

test('chr()', function (t) {
  t.test('CHR instance is a function', function (t) {
    var chr = new CHR()

    t.equal(typeof chr, 'function', 'CHR instance is a function')

    t.end()
  })

  t.test('chr() adds callers for constraints', function (t) {
    var chr = new CHR()

    chr('a, b ==> c')

    ;['a', 'b', 'c'].forEach(function (constraintName) {
      t.ok(chr.hasOwnProperty(constraintName))
      t.equal(typeof chr[constraintName], 'function', 'constraint caller is a function')
    })

    t.notOk(chr.hasOwnProperty('d'), 'constraint d not yet defined')

    chr('d ==> a')
    t.ok(chr.hasOwnProperty('d'), 'constraint d now defined')

    t.end()
  })

  t.end()
})
