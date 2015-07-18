var test = require('tape')

var CHR = require('../../src/index')

test('a ==> b', function (t) {
  var chr = new CHR()
  chr('a ==> b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('a ==> b, c', function (t) {
  var chr = new CHR()
  chr('a ==> b, c')

  chr.a()
  t.equal(chr.Store.length, 3)

  t.end()
})

test('a, b ==> c', function (t) {
  var chr = new CHR()
  chr('a, b ==> c')

  chr.a()
  t.equal(chr.Store.length, 1)

  chr.c()
  t.equal(chr.Store.length, 2)

  chr.b()
  t.equal(chr.Store.length, 4)

  t.end()
})
