var test = require('tape')

var CHR = require('../../src/index')

test('chr.Rules.Add()', function (t) {
  t.test('chr.Rules.Add() is a function', function (t) {
    var chr = new CHR()
    var rules = chr.Rules

    t.equal(typeof rules.Add, 'function', 'chr.Rules.Add() is a function')

    t.end()
  })

  t.test('chr.Rules.Add() gives rule name if not specified', function (t) {
    var chr = new CHR()

    chr('a ==> b')

    t.equal(chr.Rules.Order.length, 1)

    var ruleName = chr.Rules.Order[0]
    t.ok(ruleName)
    t.ok(chr.Rules[ruleName])
    t.equal(ruleName, chr.Rules[ruleName].Name)

    t.end()
  })

  t.test('chr.Rules.Add() throws for identical rule name', function (t) {
    var chr = new CHR()

    chr('first @ a ==> b')

    t.throws(function () {
      chr('first @ c ==> d')
    }, 'chr.Rules.Add() throws for identical rule name')

    t.end()
  })

  t.end()
})

test('chr.Rules.Order', function (t) {
  var chr = new CHR()
  var rules = chr.Rules

  t.equal(typeof rules.Order, 'object', 'chr.Rules.Order is defined')
  t.ok(rules.Order instanceof Array, 'chr.Rules.Order is an Array')

  t.end()
})

test('chr.Rules.ForEach()', function (t) {
  t.test('chr.Rules.ForEach() is a function', function (t) {
    var chr = new CHR()
    var rules = chr.Rules

    t.equal(typeof rules.ForEach, 'function', 'chr.Rules.ForEach() is a function')

    t.end()
  })

  t.test('chr.Rules.ForEach() loops through all rules', function (t) {
    var chr = new CHR()

    chr('first  @ a ==> b')
    chr('second @ c ==> d')
    chr('third  @ e ==> f')

    var rules = chr.Rules
    var found = {}
    var order = []
    rules.ForEach(function (rule) {
      found[rule.Name] = 1
      order.push(rule.Name)
    })

    var expected = {
      first: 1,
      second: 1,
      third: 1
    }

    t.deepEqual(found, expected, 'all rules examined')
    t.deepEqual(order, ['first', 'second', 'third'], 'examined in order as defined')

    t.end()
  })

  t.test('chr.Rules.ForEach() loops in order', function (t) {
    var chr = new CHR()

    chr('first  @ a ==> b')
    chr('second @ c ==> d')
    chr('third  @ e ==> f')

    var rules = chr.Rules
    var order = [
      'third',
      'first',
      'second'
    ]
    rules.Order = order

    var found = []
    rules.ForEach(function (rule) {
      found.push(rule.Name)
    })

    t.deepEqual(found, order, 'examined in specified order')

    t.end()
  })

  t.end()
})

test('chr.Rules.Reset()', function (t) {
  t.test('chr.Rules.Reset() is a function', function (t) {
    var chr = new CHR()
    var rules = chr.Rules

    t.equal(typeof rules.Reset, 'function', 'chr.Rules.Reset() is a function')

    t.end()
  })

  t.test('chr.Rules.Reset() deletes existing rules', function (t) {
    var chr = new CHR()
    var rules = chr.Rules

    chr('first @ a ==> b')
    chr('second @ c ==> d')

    t.ok(rules.first)
    t.ok(rules.second)
    t.ok(chr.a)
    t.ok(chr.b)
    t.ok(chr.c)
    t.ok(chr.d)

    rules.Reset()

    t.notOk(rules.first)
    t.notOk(rules.second)
    t.notOk(chr.a)
    t.notOk(chr.b)
    t.notOk(chr.c)
    t.notOk(chr.d)

    t.deepEqual(chr.Constraints, {})

    t.end()
  })

  t.end()
})
