/**
 * Note:
 * You should not specify JavaScript source code within
 * a string. However this is supported for applications
 * where you do the CHR parsing process not as part of the
 * tag() function but before. For example to use different
 * Webworkers for these tasks.
 *
 * Instead of specifing
 *   chr('a ==> ${ function() { console.log("OK") } }')
 * simply call
 *   chr('a ==>', function() { console.log("OK") })
 * In this way a real function is provided to CHR.js so you
 * can use well-established practices like syntax highlighting
 * and AOT syntax checking.
 */

var test = require('tape')

var CHR = require('../../src/index')

test('string replacement in body', function (t) {
  t.test('function reference', function (t) {
    var scope = (function () {
      function fire (N) {
        t.equal(N, 42)

        t.end()
      }

      return {
        fire: fire
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ fire }')

    chr.a(42)
  })

  t.test('indirection', function (t) {
    var scope = (function () {
      function fire (N) {
        t.equal(N, 42)

        t.end()
      }

      function getFire () {
        return fire
      }

      return {
        fire: fire,
        getFire: getFire
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ getFire() }')

    chr.a(42)
  })

  t.test('indirection via anonymous function', function (t) {
    var scope = (function () {
      function fire (N) {
        t.equal(N, 42)

        t.end()
      }

      return {
        fire: fire
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ function(N) { return fire(N) } }')

    chr.a(42)
  })

  t.test('variable renaming', function (t) {
    var scope = (function () {
      function fire (N) {
        t.equal(N, 42)

        t.end()
      }

      return {
        fire: fire
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(M) ==> ${ function(M) { return fire(M) } }')

    chr.a(42)
  })

  t.test('variable renaming with indirection', function (t) {
    var scope = (function () {
      function fire (N) {
        t.equal(N, 42)

        t.end()
      }

      function getFire () {
        return fire
      }

      return {
        fire: fire,
        getFire: getFire
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(M) ==> ${ function(M) { getFire()(M) } }')

    chr.a(42)
  })

  t.end()
})

test('string replacement in guard', function (t) {
  t.test('function reference, constant true', function (t) {
    var scope = (function () {
      function test () {
        return true
      }

      return {
        test: test
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ test } | b')

    chr.a(42)

    t.equal(chr.Store.length, 2, 'rule fired')

    t.end()
  })

  t.test('function reference, constant false', function (t) {
    var scope = (function () {
      function test () {
        return false
      }

      return {
        test: test
      }
    })()

    var chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ test } | b')

    chr.a(42)

    t.equal(chr.Store.length, 1, 'rule not fired')

    t.end()
  })

  t.test('string replacement', function (t) {
    var chr = new CHR()

    // should be avoided; see note above
    chr('a(N) ==> ${ function(N) { return N > 0 } } | a(N-1)')

    chr.a(4)

    t.equal(chr.Store.length, 5, 'rule executed four times')

    t.end()
  })

  t.end()
})
