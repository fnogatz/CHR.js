var test = require('tape')

var CHR = require('../../src/index')

test('a ==> 1 < 2 | b', function (t) {
  var chr = new CHR()
  chr('a ==> 1 < 2 | b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)
    t.end()
  })
})

test('a ==> 1 > 2 | b', function (t) {
  var chr = new CHR()
  chr('a ==> 1 > 2 | b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 1)
    t.end()
  })
})

test('a ==> ${ () => 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(1 < 2) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)
    t.end()
  })
})

test('a ==> ${ () => 1 > 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==>', function (cb) { cb(1 > 2) }, '| b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 1)
    t.end()
  })
})

test('Scope', function (t) {
  var chr = new CHR()
  chr('a(N) ==>', function (N, cb) { cb(N > 10) }, '| b')

  chr.a(1).then(function () {
    t.equal(chr.Store.length, 1)

    chr.a(20).then(function () {
      t.equal(chr.Store.length, 3)
      t.end()
    })
  })
})

test('Guard with used-defined predicate', function (t) {
  function greaterThan10 (N, onlyIf) {
    onlyIf(N > 10)
  }

  var chr = new CHR()
  chr('a(N) ==>', greaterThan10, '| b')

  chr.a(1).then(function () {
    t.equal(chr.Store.length, 1)

    chr.a(20).then(function () {
      t.equal(chr.Store.length, 3)
      t.end()
    })
  })
})
