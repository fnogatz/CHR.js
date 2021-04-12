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

const test = require('tape')

const CHR = require('../../src/index')

test('string replacement in body', function (t) {
  t.test('function reference', function (t) {
    const scope = (function () {
      let m

      function fire (N, cb) {
        m = N
        cb()
      }

      return {
        fire: fire,
        getM: function () {
          return m
        }
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ fire }') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(scope.getM(), 42)
      t.end()
    })
  })

  t.test('indirection', function (t) {
    const scope = (function () {
      let m

      function fire (N, cb) {
        m = N
        cb()
      }

      function getFire () {
        return fire
      }

      return {
        fire: fire,
        getFire: getFire,
        getM: function () {
          return m
        }
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ getFire() }') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(scope.getM(), 42)
      t.end()
    })
  })

  t.test('indirection via anonymous function', function (t) {
    const scope = (function () {
      let m

      function fire (N) {
        m = N
      }

      return {
        fire: fire,
        getM: function () {
          return m
        }
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ function(N, cb) { fire(N); cb() } }') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(scope.getM(), 42)
      t.end()
    })
  })

  t.test('variable renaming', function (t) {
    const scope = (function () {
      let m

      function fire (N) {
        m = N
      }

      return {
        fire: fire,
        getM: function () {
          return m
        }
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(M) ==> ${ function(M, cb) { fire(M); cb() } }') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(scope.getM(), 42)
      t.end()
    })
  })

  t.test('variable renaming with indirection', function (t) {
    const scope = (function () {
      let m

      function fire (N) {
        m = N
      }

      function getFire () {
        return fire
      }

      return {
        fire: fire,
        getFire: getFire,
        getM: function () {
          return m
        }
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(M) ==> ${ function(M, cb) { getFire()(M); cb() } }') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(scope.getM(), 42)
      t.end()
    })
  })

  t.end()
})

test('string replacement in guard', function (t) {
  t.test('function reference, constant true', function (t) {
    const scope = (function () {
      function test (cb) {
        cb(null, true)
      }

      return {
        test: test
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ test } | b') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(chr.Store.length, 2, 'rule fired')
      t.end()
    })
  })

  t.test('function reference, constant false', function (t) {
    const scope = (function () {
      function test (cb) {
        cb(null, false)
      }

      return {
        test: test
      }
    })()

    const chr = new CHR({
      scope: scope
    })

    // should be avoided; see note above
    chr('a(N) ==> ${ test } | b') // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(chr.Store.length, 1, 'rule not fired')
      t.end()
    })
  })

  t.test('string replacement', function (t) {
    const chr = new CHR()

    // should be avoided; see note above
    chr('a(N) ==> ${ function(N, cb) { cb(null, N > 0) } } | a(N-1)') // eslint-disable-line no-template-curly-in-string

    chr.a(4).then(function () {
      t.equal(chr.Store.length, 5, 'rule executed four times')
      t.end()
    })
  })

  t.end()
})

test('string replacement specified via tag function', function (t) {
  t.test('function reference', function (t) {
    let m

    const replacements = (function () {
      function fire (N, cb) { // eslint-disable-line no-unused-vars
        m = N
        cb()
      }

      return [
        'fire'
      ].map(function (repl) {
        return eval('(' + repl + ')') // eslint-disable-line no-eval
      })
    })()

    const chr = new CHR()

    // should be avoided; see note above
    chr('a(N) ==> ${ fire }', replacements) // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(m, 42)
      t.end()
    })
  })

  t.test('function', function (t) {
    let m

    const replacements = (function () {
      return [
        'function(N, cb) { t.equal(N, 42); m = N; cb() }'
      ].map(function (repl) {
        return eval('(' + repl + ')') // eslint-disable-line no-eval
      })
    })()

    const chr = new CHR()

    // should be avoided; see note above
    chr('a(N) ==> ${ function(N, cb) { t.equal(N, 42); m = N; cb() } }', replacements) // eslint-disable-line no-template-curly-in-string

    chr.a(42).then(function () {
      t.equal(m, 42)
      t.end()
    })
  })

  t.end()
})
