var test = require('tape')

var originalCompile = require('../../compile')
function compile (src) {
  return originalCompile(src, {
    exports: 'chr',
    runtime: 'require("../../runtime")'
  })
}

test('Single-line program', function (t) {
  var program = 'a <=> b'
  var source = compile(program)

  var chr
  eval(source) // eslint-disable-line no-eval

  chr.a()
  t.equal(chr.Store.length, 1)

  t.end()
})

test('Multi-line program', function (t) {
  var program = 'a ==> b\nb <=> c'
  var source = compile(program)

  var chr
  eval(source) // eslint-disable-line no-eval

  chr.a()
  t.equal(chr.Store.length, 2)

  t.end()
})
