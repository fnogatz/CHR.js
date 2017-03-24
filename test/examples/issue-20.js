var test = require('tape')

var CHR = require('../../src/index')

test("String arguments (Issue #20)", function (t) {
  var chr = new CHR()
  chr("a('p') ==> b")

  chr.a('q').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a('p').then(function () {
      t.equal(chr.Store.length, 3)

      t.end()
    })
  })
})
