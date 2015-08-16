var test = require('tape')

var CHR = require('../../src/index')

test('a ==> ${ () => 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(1 < 2) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)
    t.end()
  })
})

test('a ==> ${ 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(1 < 2) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)
    t.end()
  })
})

test('a ==> ${ () => false } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(false) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 1, 'Guard not satisfied')
    t.end()
  })
})

test('a ==> ${ () => fire("Rule fired") }', function (t) {
  var fired = false

  function fire (string) {
    fired = true
    t.equal(string, 'Rule fired')
  }

  var chr = new CHR()
  chr('a ==>', function (cb) { fire('Rule fired'); cb() })

  chr.a().then(function () {
    t.ok(fired, 'fire() has been called')
    t.end()
  })
})

test('a ==> ${ fire }', function (t) {
  var fired = false
  function fire (cb) {
    fired = true
    cb()
  }

  var chr = new CHR()
  chr('a ==>', fire)

  chr.a().then(function () {
    t.ok(fired, 'fire() has been called')
    t.end()
  })
})

test('Scope', function (t) {
  var i = 0

  var chr = new CHR()
  chr('a ==>', function (cb) { cb(i !== 0) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 1, 'b not propagated')

    i = 1
    chr.a().then(function () {
      t.equal(chr.Store.length, 3, 'b propagated')
      t.end()
    })
  })
})

test('Replacement in String', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(true) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)
    t.end()
  })
})

test('Replacement with variable', function (t) {
  t.test('a(N) ==> ${ (N) => p(N) }', function (t) {
    function p (N) {
      // noop
    }

    var chr = new CHR()
    chr('a(N) ==>', function (N, cb) { p(N); cb() })

    chr.a(42).then(function () {
      t.end()
    })
  })

  t.test('a(N) ==> ${ (N) => p(N) }', function (t) {
    var n

    function p (k) {
      n = k
    }

    var chr = new CHR()
    chr('a(N) ==>', function (N, cb) { p(N); cb() })

    chr.a(42).then(function () {
      t.equal(n, 42)
      t.end()
    })
  })

  t.test('a(N) ==> ${ p }', function (t) {
    var m

    function p (N, cb) {
      m = N
      cb()
    }

    var chr = new CHR()
    chr('a(N) ==>', p)

    chr.a(42).then(function () {
      t.equal(m, 42)
      t.end()
    })
  })

  t.end()
})
