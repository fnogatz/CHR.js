const test = require('tape')

const CHR = require('../../src/index')

test('String arguments (Issue #20)', function (t) {
  const chr = new CHR()
  chr("a('p') ==> b")

  chr.a('q').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a('p').then(function () {
      t.equal(chr.Store.length, 3)

      t.end()
    })
  })
})

test('String arguments (Issue #20), with Int value', function (t) {
  const chr = new CHR()
  chr("a('42') ==> b")

  chr.a(42).then(function () {
    t.equal(chr.Store.length, 1)

    chr.a('42').then(function () {
      t.equal(chr.Store.length, 3)

      t.end()
    })
  })
})

test('Int arguments', function (t) {
  const chr = new CHR()
  chr('a(42) ==> b')

  chr.a('q').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a('42').then(function () {
      t.equal(chr.Store.length, 2)

      chr.a(42).then(function () {
        t.equal(chr.Store.length, 4)

        t.end()
      })
    })
  })
})

test('Check String argument in guard', function (t) {
  const chr = new CHR()
  chr("a(X) ==> X === 'p' | b")

  chr.a('q').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a('p').then(function () {
      t.equal(chr.Store.length, 3)

      t.end()
    })
  })
})

test('Check String argument in guard, with Int value', function (t) {
  const chr = new CHR()
  chr("a(X) ==> X === '42' | b")

  chr.a('q').then(function () {
    t.equal(chr.Store.length, 1)

    chr.a(42).then(function () {
      t.equal(chr.Store.length, 2)

      chr.a('42').then(function () {
        t.equal(chr.Store.length, 4)

        t.end()
      })
    })
  })
})
