const test = require('tape')

const joinParts = require('../src/join-parts')

test('Single string', function (t) {
  const res = joinParts([
    'a ==> b'
  ])
  t.equal(res, 'a ==> b')

  t.end()
})

test('Single replacement', function (t) {
  const res = joinParts([
    'a ==>',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Head ends with space', function (t) {
  const res = joinParts([
    'a ==> ',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Single replacement, ending with space', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Multiple replacements, separated by comma', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    ',',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Multiple replacements, separated by comma, ending with empty space', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    ',',
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}, ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Multiple replacements, without comma separation', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Multiple replacements, without comma separation, ending with empty space', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    function () {},
    ''
  ])
  t.equal(res, 'a ==> ${0}, ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed constraints and replacement comma sepator', function (t) {
  const res = joinParts([
    'a ==> b,',
    function () {}
  ])
  t.equal(res, 'a ==> b, ${0}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma', function (t) {
  const res = joinParts([
    'a ==> b',
    function () {}
  ])
  t.equal(res, 'a ==> b, ${0}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma, ending with constraint', function (t) {
  const res = joinParts([
    'a ==> b',
    function () {},
    'c'
  ])
  t.equal(res, 'a ==> b, ${0}, c') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Constraint prefixed with comma', function (t) {
  const res = joinParts([
    'a ==> b',
    function () {},
    ', c'
  ])
  t.equal(res, 'a ==> b, ${0}, c') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed constraints and replacement comma sepator, without comma, ending with multiple constraints', function (t) {
  const res = joinParts([
    'a ==> b',
    function () {},
    'c, d'
  ])
  t.equal(res, 'a ==> b, ${0}, c, d') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Also works for simplification rule', function (t) {
  const res = joinParts([
    'a <=> b',
    function () {},
    'c, d'
  ])
  t.equal(res, 'a <=> b, ${0}, c, d') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Function in guard', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    '|',
    function () {}
  ])
  t.equal(res, 'a ==> ${0} | ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed content in guard', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    function () {},
    'c |',
    function () {}
  ])
  t.equal(res, 'a ==> ${0}, ${1}, c | ${2}') // eslint-disable-line no-template-curly-in-string

  t.end()
})

test('Mixed content after guard', function (t) {
  const res = joinParts([
    'a ==>',
    function () {},
    '| b',
    function () {}
  ])
  t.equal(res, 'a ==> ${0} | b, ${1}') // eslint-disable-line no-template-curly-in-string

  t.end()
})
