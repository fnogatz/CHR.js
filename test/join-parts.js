var test = require('tape')

var joinParts = require('../src/join-parts')

test('Single string', function (t) {
  var res = joinParts([
    'a ==> b'
  ])
  t.equal(res, 'a ==> b')

  t.end()
})

test('Single replacement', function (t) {
  var res = joinParts([
    'a ==>',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}')

  t.end()
})

test('Head ends with space', function (t) {
  var res = joinParts([
    'a ==> ',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}')

  t.end()
})

test('Single replacement, ending with space', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}')

  t.end()
})

test('Multiple replacements, separated by comma', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    ',',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}')

  t.end()
})

test('Multiple replacements, separated by comma, ending with empty space', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    ',',
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}, ${1}')

  t.end()
})

test('Multiple replacements, without comma separation', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}')

  t.end()
})

test('Multiple replacements, without comma separation, ending with empty space', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}, ${1}')

  t.end()
})

test('Mixed constraints and replacement comma sepator', function (t) {
  var res = joinParts([
    'a ==> b,',
    function () {}
  ])
  t.equal(res, 'a ==> b, ${0}')

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma', function (t) {
  var res = joinParts([
    'a ==> b',
    function () {}
  ])
  t.equal(res, 'a ==> b, ${0}')

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma, ending with constraint', function (t) {
  var res = joinParts([
    'a ==> b',
    function () {},
    'c'
  ])
  t.equal(res, 'a ==> b, ${0}, c')

  t.end()
})

test('Constraint prefixed with comma', function (t) {
  var res = joinParts([
    'a ==> b',
    function () {},
    ', c'
  ])
  t.equal(res, 'a ==> b, ${0}, c')

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma, ending with multiple constraints', function (t) {
  var res = joinParts([
    'a ==> b',
    function () {},
    'c, d'
  ])
  t.equal(res, 'a ==> b, ${0}, c, d')

  t.end()
})

test('Also works for simplification rule', function (t) {
  var res = joinParts([
    'a <=> b',
    function () {},
    'c, d'
  ])
  t.equal(res, 'a <=> b, ${0}, c, d')

  t.end()
})

test('Function in guard', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    '|',
    function () {}
  ])
  t.equal(res, 'a ==> ${0} | ${1}')

  t.end()
})

test('Mixed content in guard', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    function () {},
    'c |',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}, c | ${2}')

  t.end()
})

test('Mixed content after guard', function (t) {
  var res = joinParts([
    'a ==>',
    function () {},
    '| b',
    function () {}
  ])
  t.equal(res, 'a ==> ${0} | b, ${1}')

  t.end()
})
