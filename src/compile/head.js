module.exports = Compiler

var util = require('./util')
var fakeScope = require('./fake-scope')

var indent = util.indent
var indentBy = util.indentBy
var destructuring = util.destructuring

function Compiler (rule, opts) {
  opts = opts || {}

  this.rule = rule

  this.replacements = opts.replacements || {}
  this.scope = opts.scope || {}

  this.opts = {
    this: opts.this || 'this',
    helper: opts.helper || 'self.Helper'
  }
}

Compiler.prototype.headNo = function compileHeadNo (headNo) {
  var self = this
  headNo = headNo || 0
  var rule = this.rule
  var opts = this.opts

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

    if (guard.hasOwnProperty('num')) {
      // get parameters via dependency injection
      var params = util.getFunctionParameters(self.replacements[guard.num])
      parts.push(
        indent(level + 0) + 'if (!replacements["' + guard.num + '"].apply(self, [' + params + '])) {',
        indent(level + 1) + 'return',
        indent(level + 0) + '}'
      )

      return
    }

    if (guard.hasOwnProperty('expr')) {
      parts.push(
        indent(level + 0) + 'if (!' + fakeScope(self.scope, guard.expr.original, true) + ') {',
        indent(level + 1) + 'return',
        indent(level + 0) + '}'
      )

      return
    }
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
    parts.push(indent(level) + this.generateGuards())
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
      var tell = self.generateTell(body).map(indentBy(level))
      parts = parts.concat(tell)
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

Compiler.prototype.generateGuards = function generateGuards () {
  var self = this
  var rule = this.rule

  var expr = 'if ('
  var boolExprs = []
  rule.guard.forEach(function (guard) {
    if (guard.type !== 'Replacement') {
      boolExprs.push(self.generateGuard(guard))
    }
  })
  expr += boolExprs.join(' && ')
  expr += ') {'
  return expr
}

Compiler.prototype.generateGuard = function generateGuard (guard) {
  if (guard.type === 'BinaryExpression') {
    return this.generateBinaryExpression(guard)
  }

  return 'false'
}

Compiler.prototype.generateTell = function generateTell (body) {
  var self = this

  var expr = ''
  if (body.type === 'Constraint') {
    expr += 'self.' + body.name + '('
    expr += body.parameters.map(function (parameter) {
      return self.generateExpression(parameter)
    }).join(', ')
    expr += ')'

    return [ expr ]
  }

  if (body.type === 'Replacement') {
    if (body.hasOwnProperty('original')) {
      return [
        ';(function() { ' + body.original + ' })()'
      ]
    }

    if (body.hasOwnProperty('num')) {
      // get parameters via dependency injection
      var params = util.getFunctionParameters(self.replacements[body.num])
      return [
        'replacements["' + body.num + '"].apply(null, [' + params + '])'
      ]
    }

    if (body.hasOwnProperty('expr')) {
      return fakeScope(self.scope, body.expr.original)
    }

    return
  }

  expr += [
    'if (!(' + self.generateBinaryExpression(body) + ')) {',
    indent(1) + 'self.Store.invalidate()',
    indent(1) + 'return',
    '}'
  ].join('\n')
  return [ expr ]
}

Compiler.prototype.generateBinaryExpression = function generateBinaryExpression (expr) {
  var self = this

  return [ 'left', 'right' ].map(function (part) {
    if (expr[part].type === 'Identifier') {
      return expr[part].name
    }
    if (expr[part].type === 'Literal') {
      return expr[part].value
    }
    if (expr[part].type === 'BinaryExpression') {
      return '(' + self.generateBinaryExpression(expr[part]) + ')'
    }
  }).join(' ' + expr.operator + ' ')
}

Compiler.prototype.generateExpression = function generateExpression (parameter) {
  if (parameter.type === 'Identifier') {
    return parameter.name
  }
  if (parameter.type === 'BinaryExpression') {
    return this.generateBinaryExpression(parameter)
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
