module.exports = compileHead

var util = require('./util')

var indent = util.indent
var indentBy = util.indentBy
var destructuring = util.destructuring

function compileHead (rule, headNo, opts) {
  headNo = headNo || 0
  opts = opts || {}
  opts.this = opts.this || 'this'
  opts.helper = opts.helper || 'self.Helper'

  if (!rule.head[headNo]) {
    throw new Error('No constraint with number ' + headNo + ' in this rule head')
  }

  var constraint = rule.head[headNo]
  if (constraint.type !== 'Constraint') {
    throw new Error('No constraint at number ' + headNo)
  }

  var parts = []
  parts.push(
    'var self = ' + opts.this,
    ''
  )

  if (constraint.arity > 0) {
    parts.push(
      indent(0, destructuring(constraint, 'constraint.args')).join('\n'),
      indent(0)
    )
  }

  var j
  var level = 0
  var ids = []
  for (j = 0; j < rule.head.length; j++) {
    if (j === headNo) {
      ids.push('constraint.id')
      continue
    }

    ids.push('id' + (j + 1))

    parts.push(indent(level) + 'self.Store.lookup("' + rule.head[j].name + '", ' + rule.head[j].arity + ').forEach(function (id' + (j + 1) + ') {')
    level++

    parts.push(
      indent(level, 'if (!self.Store.alive(id' + (j + 1) + ')) {'),
      indent(level + 1) + 'return',
      indent(level, '}')
    )

    if (rule.head[j].arity > 0) {
      parts.push(
        indent(level, destructuring(rule.head[j], 'self.Store.args(id' + (j + 1) + ')')).join('\n')
      )
    }

    parts.push(indent(level))
  }

  // check guard replacements
  var guardWithoutReplacements = []
  rule.guard.forEach(function (guard) {
    if (guard.type !== 'Replacement') {
      guardWithoutReplacements.push(guard)
      return
    }

    // is Replacement
    parts.push(
      indent(level + 0) + 'if (!(function() { return ' + guard.original + ' }())) {',
      indent(level + 1) + 'return',
      indent(level + 0) + '}'
    )
  })

  if (guardWithoutReplacements !== rule.guard.length) {
    parts.push(indent(level))
  }

  parts.push(
    indent(level + 0) + 'var ids = [ ' + ids.join(', ') + ' ]',
    indent(level + 0) + 'if (ids.every(function(id) { return self.Store.alive(id) })) {',
    indent(level + 1) + 'if (' + opts.helper + '.allDifferent(ids)) {'
  )
  level += 2

  if (guardWithoutReplacements.length > 0) {
    parts.push(indent(level) + generateGuards(opts, rule))
    level += 1
  }

  parts.push(
    indent(level + 0) + 'if (self.History.notIn("' + rule.name + '", ids)) {',
    indent(level + 1) + 'self.History.add("' + rule.name + '", ids)'
  )

  level += 1

  for (var k = rule.r + 1; k <= rule.head.length; k++) {
    // remove constraints
    parts.push(indent(level) + 'self.Store.kill(ids[' + (k - 1) + '])')
  }

  if (rule.body.length > 0) {
    rule.body.forEach(function (body) {
      parts.push(indent(level) + generateTell(opts, body))
    })
  }

  level -= 1
  parts.push(indent(level) + '}')

  if (guardWithoutReplacements.length > 0) {
    level -= 1
    parts.push(indent(level) + '}')
  }

  level -= 2
  parts.push(
    indent(level + 1) + '}',
    indent(level + 0) + '}'
  )

  for (j = rule.head.length - 1; j >= 0; j--) {
    if (j === headNo) {
      continue
    }

    level--
    parts.push(indent(level) + '})')
  }

  parts = parts.map(indentBy(1))

  return parts
}

function generateGuards (opts, rule) {
  var expr = 'if ('
  var boolExprs = []
  rule.guard.forEach(function (guard) {
    if (guard.type !== 'Replacement') {
      boolExprs.push(generateGuard(opts, guard))
    }
  })
  expr += boolExprs.join(' && ')
  expr += ') {'
  return expr
}

function generateGuard (opts, guard) {
  if (guard.type === 'BinaryExpression') {
    return generateBinaryExpression(opts, guard)
  }

  return 'false'
}

function generateTell (opts, body, constraints) {
  var expr = ''
  if (body.type === 'Constraint') {
    expr += 'self.' + body.name + '('
    expr += body.parameters.map(function (parameter) {
      return generateExpression(opts, parameter)
    }).join(', ')
    expr += ')'

    // setTell(constraints, body)

    return expr
  }

  if (body.type === 'Replacement') {
    return ';(function() { ' + body.original + ' })()'
  }

  expr += [
    'if (!(' + generateBinaryExpression(opts, body) + ')) {',
    indent(1) + 'self.Store.invalidate()',
    indent(1) + 'return',
    '}'
  ].join('\n')
  return expr
}

function generateBinaryExpression (opts, expr) {
  return [ 'left', 'right' ].map(function (part) {
    if (expr[part].type === 'Identifier') {
      return expr[part].name
    }
    if (expr[part].type === 'Literal') {
      return expr[part].value
    }
    if (expr[part].type === 'BinaryExpression') {
      return '(' + generateBinaryExpression(opts, expr[part]) + ')'
    }
  }).join(' ' + expr.operator + ' ')
}

function generateExpression (opts, parameter) {
  if (parameter.type === 'Identifier') {
    return parameter.name
  }
  if (parameter.type === 'BinaryExpression') {
    return generateBinaryExpression(opts, parameter)
  }
  if (parameter.type === 'Literal') {
    return escape(parameter.value)
  }
}

function escape (val) {
  if (typeof val === 'string') {
    return '"' + val + '"'
  }

  return val
}
