var test = require('tape')

var CHR = require('../../src/index')

test('a <=> b', function (t) {
  var chr = new CHR()
  chr('a <=> b')

  chr.a().then(function () {
    t.equal(chr.Store.length, 1)
    t.end()
  })
})

test('a <=> true', function (t) {
  var chr = new CHR()
  chr('a <=> true')

  chr.a().then(function () {
    t.equal(chr.Store.length, 0)
    t.end()
  })
})

test('a(0) <=> true', function (t) {
  var chr = new CHR()
  chr('a(0) <=> true')

  chr.a(0).then(function () {
    t.equal(chr.Store.length, 0)
    t.end()
  })
})

test('a \\ b <=> true', function (t) {
  var chr = new CHR()
  chr('a \\ b <=> true')

  chr.b().then(function () {
    t.equal(chr.Store.length, 1)
    t.ok(chr.Store.alive(1))
    t.notOk(chr.Store.alive(2))

    return chr.a()
  }).then(function () {
    t.equal(chr.Store.length, 1)
    t.ok(chr.Store.alive(2))
    t.notOk(chr.Store.alive(1))

    t.end()
  })
})
