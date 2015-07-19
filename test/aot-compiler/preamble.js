var test = require('tape')

var originalCompile = require('../../compile')
function compile (src) {
  return originalCompile(src, {
    exports: 'chr',
    runtime: 'require("../../runtime")'
  })
}

test('Preamble', function (t) {
  var program = `
    {
      var x = 0
    }

    a ==> b
  `
  var source = compile(program)

  var chr
  eval(source) // eslint-disable-line no-eval

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})

test('Local variable', function (t) {
  var program = `
    {
      var x = 0
    }

    a ==> x !== 0 | b
    c ==> x === 0 | d
  `
  var source = compile(program)

  var chr
  eval(source) // eslint-disable-line no-eval

  chr.a()
  t.equal(chr.Store.length, 1)

  chr.c()
  t.equal(chr.Store.length, 3)

  t.end()
})

test('Local variable with Replacements', function (t) {
  var program = `
    {
      var x = 0
    }

    a ==> \${ x !== 0 } | b
    c ==> \${ x === 0 } | d
  `
  var source = compile(program)

  var chr
  eval(source) // eslint-disable-line no-eval

  chr.a()
  t.equal(chr.Store.length, 1)

  chr.c()
  t.equal(chr.Store.length, 3)

  t.end()
})

test('Fire function defined in preamble', function (t) {
  var chr

  function outside (str) { // eslint-disable-line no-unused-vars
    t.equal(chr.Store.length, 1)
    t.equal(str, 'called')

    t.end()
  }

  var program = `
    {
      function inside(str) {
        outside(str)
      }
    }

    a ==> \${ inside('called') }
  `
  var source = compile(program)
  eval(source) // eslint-disable-line no-eval

  chr.a()
})
