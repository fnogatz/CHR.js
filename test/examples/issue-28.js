var test = require('tape')

var CHR = require('../../src/index')

test('null as argument in caller (Issue #28)', function (t) {
  var chr = new CHR()
  chr('a(null) ==> b')

  chr.a('some').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a(null).then(function () {
      t.equal(chr.Store.length, 3)

      t.end()
    })
  })
})

test('null as argument in result (Issue #28)', function (t) {
  var chr = new CHR()
  chr('a ==> b(null)')

  chr.a().then(function () {
    t.equal(chr.Store.length, 2)

    t.end()
  })
})
