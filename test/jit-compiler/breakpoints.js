const test = require('tape')

const CHR = require('../../src/index')

test('Rule.Brekpoints.onTry', function (t) {
  t.test('single, simple rule', function (t) {
    const chr = new CHR()
    chr('r1 @ a ==> b')

    let called = false

    chr.Rules.r1.Breakpoints.onTry = function (data, callback) {
      called = true
      callback()
    }

    t.notOk(called, 'Event not yet triggered')

    chr.a().then(function () {
      t.ok(called, 'Event has been triggered')
      t.equal(chr.Store.length, 2, 'Rule applied')
      t.end()
    })
  })

  t.test('given data', function (t) {
    const chr = new CHR()
    chr('r1 @ a ==> b')

    let data

    chr.Rules.r1.Breakpoints.onTry = function (d, callback) {
      data = d
      callback()
    }

    chr.a().then(function () {
      t.ok(data)
      t.ok(data.rule)
      t.ok(data.constraint)

      t.end()
    })
  })

  t.test('multiple Rules', function (t) {
    const chr = new CHR()
    chr('r1 @ a ==> b')
    chr('r2 @ a ==> c')
    chr('r3 @ a ==> d')

    const called = []
    const expected = ['r1', 'r2', 'r3']

    chr.Rules.r1.Breakpoints.onTry = function (data, callback) {
      called.push(data.rule)
      callback()
    }
    chr.Rules.r2.Breakpoints.onTry = function (data, callback) {
      called.push(data.rule)
      callback()
    }
    chr.Rules.r3.Breakpoints.onTry = function (data, callback) {
      called.push(data.rule)
      callback()
    }

    t.equal(called.length, 0, 'Events not yet triggered')

    chr.a().then(function () {
      t.deepEqual(called, expected, 'Events have been triggered in correct order')
      t.equal(chr.Store.length, 4, 'All rules applied')
      t.end()
    })
  })

  t.test('via chr.Rules.setBreakpoints()', function (t) {
    const chr = new CHR()
    chr('r1 @ a ==> b')

    let called = false

    chr.Rules.SetBreakpoints(function (data, callback) {
      called = true
      callback()
    })

    t.notOk(called, 'Event not yet triggered')

    chr.a().then(function () {
      t.ok(called, 'Event has been triggered')
      t.equal(chr.Store.length, 2, 'Rule applied')
      t.end()
    })
  })

  t.end()
})
