const test = require('tape')

const dist = require('../../dist/chr')
const distWithoutParser = require('../../dist/chr-wop.min.js')
const version = require('../../package.json').version

;[dist, distWithoutParser].forEach(function (CHR) {
  test('CHR.version', function (t) {
    t.ok(CHR.version, 'CHR.version is set')
    t.equal(CHR.version, version, 'correct CHR.version')

    t.end()
  })

  test('CHR.Constraint', function (t) {
    t.ok(CHR.Constraint, 'CHR.Constraint is set')
    t.equal(typeof CHR.Constraint, 'function', 'CHR.Constraint is a function')

    t.end()
  })
})
