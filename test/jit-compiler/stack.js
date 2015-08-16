var test = require('tape')

var CHR = require('../../src/index')

test('Prevent MaxRange error for large recursions', function (t) {
  var chr = new CHR()

  var maxCall = 10000

  chr('r1 @ a(N) ==> N > 0 | a(N-1)')
  chr.a(maxCall).then(function () {
    t.equal(chr.Store.length, maxCall + 1, 'Rule applied ' + maxCall + ' times')
    t.end()
  })
})
