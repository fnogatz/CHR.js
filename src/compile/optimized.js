module.exports = transform

var parse = require('../parser.peg.js').parse
var util = require('./util')

var indent = util.indent

function transform (program, opts) {
  opts = opts || {}

  var parsed = parse(program, {
    startRule: 'ProgramWithPreamble'
  })
  var rules = parsed.body

  var constraints = {}

  var parts = []
  var level = 1

  parts.push(
    indent(0) + 'module.exports = (function () {',
    indent(1) + 'var chr = {',
    indent(1) + '  Store:',
    indent(1) + '}',
    ''
  )

  addStatics(parts, 1)

  // add optional preamble
  if (parsed.preamble) {
    parts.push(indent(level) + parsed.preamble)
    parts.push(indent(level))
  }

  // handle all rules
  rules.forEach(function (ruleObj) {
    // TODO

    ruleObj.constraints.forEach(function (functor) {
      if (isBuiltIn(functor)) {
        return
      }

      // add callers if not present
      var parts = functor.split('/')
      var name = parts[0]
      var arity = parts[1]
      if (!constraints[name]) {
        constraints[name] = {}
      }
      if (!constraints[name][arity]) {
        constraints[name][arity] = true
      }
    })
  })

  addConstraintCallers(parts, 1, constraints)

  parts.push(
    indent(1) + 'return chr',
    indent(0) + '})()'
  )

  return parts.join('\n')
}

function addStatics (parts, level) {
  var l = level || 0

  // Constraint
  parts.push(
    indent(l) + 'function Constraint (name, arity, args) {',
    indent(l) + '  this.name = name',
    indent(l) + '  this.arity = arity',
    indent(l) + '  this.functor = name + "/" + arity',
    indent(l) + '  this.args = args',
    indent(l) + '  this.id = null',
    indent(l) + '  this.alive = true',
    indent(l) + '  this.activated = false',
    indent(l) + '  this.stored = false',
    indent(l) + '  this.hist = null',
    indent(l) + '  this.cont = null',
    indent(l) + '}',
    '',
    indent(l) + 'Constraint.prototype.continue = function () {',
    indent(l) + '  this.cont.call(this, this)',
    indent(l) + '}',
    ''
  )

  // trampoline
  parts.push(
    indent(l) + 'function trampoline () {',
    indent(l) + '  var constraint',
    indent(l) + '  while (constraint = stack.pop()) {',
    indent(l) + '    constraint.continue()',
    indent(l) + '  }',
    indent(l) + '}',
    ''
  )

  // stack variable
  parts.push(
    indent(l) + 'var stack = []',
    ''
  )
}

function addConstraintCallers (parts, level, constraints) {
  var l = level || 0

  // create functions
  Object.keys(constraints).forEach(function (constraintName) {
    parts.push(
      indent(l) + 'function ' + constraintName + ' () {',
      indent(l) + '  var args = Array.prototype.slice.call(arguments)',
      indent(l) + '  var arity = arguments.length',
      indent(l) + '  var functor = "' + constraintName + '/" + arity',
      indent(l) + '  var constraint = new Constraint("gcd", arity, args)'
    )

    addConstraintContinuations(parts, l + 1, constraints, constraintName)

    parts.push(
      indent(l) + '  stack.push(constraint)',
      '',
      indent(l) + '  trampoline()',
      indent(l) + '}'
    )
  })
}

function addConstraintContinuations (parts, level, constraints, constraintName) {
  var l = level || 0

  var constraint = constraints[constraintName]

  var arities = Object.keys(constraint)
  if (arities.length === 1) {
    parts.push(
      indent(l) + 'if (arity === ' + arities[0] + ') {',
      indent(l) + '  constraint.cont = ' + getContinuationReference(constraintName, arities[0], 0),
      indent(l) + '} else {',
      indent(l) + '  throw new Error("Undefined constraint: " + functor)',
      indent(l) + '}'
    )
  } else {
    parts.push(
      indent(l) + 'switch(arity) {'
    )
    arities.sort(function (a, b) { return a - b }).forEach(function (arity) {
      parts.push(
        indent(l + 1) + 'case ' + arity + ':',
        indent(l + 1) + '  constraint.cont = ' + getContinuationReference(constraintName, arity, 0),
        indent(l + 1) + '  break'
      )
    })
    parts.push(
      indent(l + 1) + 'default:',
      indent(l + 1) + '  throw new Error("Undefined constraint: " + functor)'
    )
    parts.push(
      indent(l) + '}'
    )
  }
}

function isBuiltIn (functor) {
  if (functor === 'true/0') { return true }

  return false
}

function getContinuationReference (name, arity, no) {
  return '__' + name + '_' + arity + '_' + no
}
