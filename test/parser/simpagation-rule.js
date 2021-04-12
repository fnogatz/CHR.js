const test = require('tape')

const parse = require('../../parse').element('SimpagationRule')

test('a \\ b <=> c', function (t) {
  const res = parse('a \\ b <=> c')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimpagationRule')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 1)

  t.end()
})

test('a \\ b, c <=> d', function (t) {
  const res = parse('a \\ b, c <=> d')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 2)
  t.equal(res.body.length, 1)

  t.end()
})

test('a, b \\ c <=> d', function (t) {
  const res = parse('a, b \\ c <=> d')

  t.equal(res.kept.length, 2)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 1)

  t.end()
})

test('a \\ b <=> c, d', function (t) {
  const res = parse('a \\ b <=> c, d')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 2)

  t.end()
})

test('a \\ b <=> 3 < 4 | c', function (t) {
  const res = parse('a \\ b <=> 3 < 4 | c')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 1)

  t.equal(res.guard.length, 1)

  t.end()
})

test('a \\ b <=> 3 < 4 | c', function (t) {
  const res = parse('a \\ b <=> 3 < 4, 5 > 6 | c')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 1)

  t.equal(res.guard.length, 2)

  t.end()
})

test('Simpagation with slash instead of backslash', function (t) {
  const res = parse('a / b <=> c')

  t.equal(typeof res, 'object')
  t.equal(res.type, 'SimpagationRule')

  t.equal(res.kept.length, 1)
  t.equal(res.removed.length, 1)
  t.equal(res.body.length, 1)

  t.end()
})
