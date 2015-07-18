var test = require('tape')

var CHR = require('../../src/index')

test('a ==> b', function (t) {
  var chr = new CHR()
  chr('a ==> b')

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})
