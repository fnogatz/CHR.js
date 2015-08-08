var test = require('tape')

var CHR = require('../../src/index')

test('a ==> ${ () => 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function () { return 1 < 2 }, '| b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function () { return 1 < 2 }, '| b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ () => false } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function () { return false }, '| b')

  chr.a()
  t.equal(chr.Store.length, 1, 'Guard not satisfied')

  t.end()
})

test('a ==> ${ () => false } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function () { return false }, '| b')

  chr.a()
  t.equal(chr.Store.length, 1, 'Guard not satisfied')

  t.end()
})

test('a ==> ${ () => fire("Rule fired") }', function (t) {
  function fire (string) {
    t.equal(string, 'Rule fired')

    t.end()
  }

  var chr = new CHR()
  chr('a ==>', function () { fire('Rule fired') })

  chr.a()
})

test('a ==> ${ fire }', function (t) {
  function fire () {
    t.end()
  }

  var chr = new CHR()
  chr('a ==>', fire)

  chr.a()
})

test('Scope', function (t) {
  var i = 0

  var chr = new CHR()
  chr('a ==>', function () { return i !== 0 }, '| b')

  chr.a()

  t.equal(chr.Store.length, 1, 'b not propagated')

  i = 1
  chr.a()
  t.equal(chr.Store.length, 3, 'b propagated')

  t.end()
})

test('Replacement in String', function (t) {
  var chr = new CHR()
  chr('a ==>', function () { return true }, '| b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('Replacement with variable', function (t) {
  t.test('a(N) ==> ${ (N) => console.log(N) }', function (t) {
    var chr = new CHR()
    chr('a(N) ==>', function (N) { console.log(N) })

    chr.a(42)

    t.end()
  })

  t.test('a(N) ==> ${ (N) => p(N) }', function (t) {
    function p (k) {
      t.equal(k, 42)
      t.end()
    }

    var chr = new CHR()
    chr('a(N) ==>', function (N) { p(N) })

    chr.a(42)
  })

  t.test('a(N) ==> ${ p }', function (t) {
    function p (N) {
      t.equal(N, 42)
      t.end()
    }

    var chr = new CHR()
    chr('a(N) ==>', p)

    chr.a(42)
  })

  t.end()
})
