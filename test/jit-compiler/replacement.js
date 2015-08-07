var test = require('tape')

var CHR = require('../../src/index')

test('a ==> ${ () => 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr`
    a ==> ${ () => 1 < 2 } | b
  `

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr`
    a ==> ${ 1 < 2 } | b
  `

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ () => false } | b', function (t) {
  var chr = new CHR()
  chr`
    a ==> ${ () => false } | b
  `

  chr.a()
  t.equal(chr.Store.length, 1, 'Guard not satisfied')

  t.end()
})

test('a ==> ${ false } | b', function (t) {
  var chr = new CHR()
  chr`
    a ==> ${ false } | b
  `

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
  chr`
    a ==> ${ () => fire('Rule fired') }
  `

  chr.a()
})

test('a ==> ${ fire }', function (t) {
  function fire () {
    t.end()
  }

  var chr = new CHR()
  chr`
    a ==> ${ fire }
  `

  chr.a()
})

test('Scope', function (t) {
  var chr = new CHR()
  chr`
    a ==> ${ () => i !== 0 } | b
  `

  var i = 0
  chr.a()

  t.equal(chr.Store.length, 1, 'b not propagated')

  i = 1
  chr.a()
  t.equal(chr.Store.length, 3, 'b propagated')

  t.end()
})

test('Replacement in String', function (t) {
  t.test('a ==> ${ () => true } | b', function (t) {
    var chr = new CHR()
    chr('a ==> ${ () => true } | b')

    chr.a()
    t.equal(chr.Store.length, 2)

    t.end()
  })

  t.test('a ==> ${ true } | b', function (t) {
    var chr = new CHR()
    chr('a ==> ${ true } | b')

    chr.a()
    t.equal(chr.Store.length, 2)

    t.end()
  })

  t.end()
})

test('Replacement with variable', function (t) {
  // TODO
  /*
  t.test('a(N) ==> ${ () => console.log(N) }', function (t) {
    var chr = new CHR()
    chr('a(N) ==> ${ () => console.log(N) }')

    chr.a(42)

    t.end()
  })

  t.test('a(N) ==> ${ () => p(N) }', function (t) {
    function p (k) { // eslint-disable-line no-unused-vars
      t.equal(k, 42)
      t.end()
    }

    var chr = new CHR()
    chr('a(N) ==> ${ () => p(N) }')

    chr.a(42)

    t.end()
  })
  */

  t.end()
})
