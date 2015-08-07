var test = require('tape')

var CHR = require('../../src/index')

test('a ==> 1 < 2 | b', function (t) {
  var chr = new CHR()
  chr('a ==> 1 < 2 | b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> 1 > 2 | b', function (t) {
  var chr = new CHR()
  chr('a ==> 1 > 2 | b')

  chr.a()
  t.equal(chr.Store.length, 1)

  t.end()
})

test('a ==> ${ () => 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==> ${ () => 1 < 2 } | b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ 1 < 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==> ${ 1 < 2 } | b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> ${ () => 1 > 2 } | b', function (t) {
  var chr = new CHR()
  chr('a ==> ${ () => 1 > 2 } | b')

  chr.a()
  t.equal(chr.Store.length, 1)

  t.end()
})
