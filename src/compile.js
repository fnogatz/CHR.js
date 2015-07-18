module.exports = {
  head: compileHead
}

/*
module.exports = compile

var parse = require('./parser').parse

function compile (code, opts) {
  opts = opts || {}
  opts.runtime = opts.runtime || 'Runtime'
  opts.exports = opts.exports || 'module.exports'

  var program = parse(code)

  var parts = []

  if (!opts.withoutHeader) {
    parts.push(generateHeader(opts))
    parts.push('')
  }

  parts.push(generateStatic(opts, program))
  parts.push('')

  var constraints = {}
  var ruleNo = 1
  program.body.forEach(function (body) {
    if (body.type === 'PropagationRule' || body.type === 'SimplificationRule' || body.type === 'SimpagationRule') {
      if (!body.name) {
        body.name = '__rule_' + ruleNo
      }
      ruleNo++

      parts.push(translateRule(body, opts, constraints))
    }
  })

  parts.push(generateActivateProperties(opts, constraints))
  parts.push(generateDummyActivateProperties(opts, constraints))

  if (!opts.withoutExport) {
    parts.push(opts.exports + ' = new CHR()')
  }

  var generatedCode = parts.join('\n')

  return generatedCode
}

function translateRule (rule, opts, constraints) {
  var parts = []

  rule.constraints.forEach(function (functor) {
    var name = functor.replace(/^(.+)\/.+$/, '$1')
    if (!constraints.hasOwnProperty(name)) {
      constraints[name] = {
        occurences: {},
        tell: {}
      }

      parts.push(generateConstraintProperty(opts, name))
      parts.push('')
    }
  })

  parts.push(generateOccurenceProperties(opts, rule, constraints))

  return parts.join('\n')
}

function generateHeader (opts) {
  return [
    'var ' + opts.runtime + ' = require("chr/runtime")'
  ].join('\n')
}

function generateStatic (opts, program) {
  return [
    indent(0) + 'function CHR(store, history) {',
    indent(1) + 'this.Store = store || new ' + opts.runtime + '.Store()',
    indent(1) + 'this.History = history || new ' + opts.runtime + '.History()',
    indent(1) + 'this.constraints = ' + (program.constraints.length === 0 ? '[]' : '[ "' + program.constraints.join('", "') + '" ]'),
    indent(0) + '}'
  ].join('\n')
}

function generateConstraintProperty (opts, name) {
  return [
    indent(0) + 'CHR.prototype.' + name + ' = function ' + name + '() {',
    indent(1) + 'var args = Array.prototype.slice.call(arguments)',
    indent(1) + 'var arity = arguments.length',
    indent(1),
    indent(1) + 'var callConstraint = "_' + name + '_"+arity+"_activate"',
    indent(1) + 'if (!this[callConstraint]) {',
    indent(2) + 'throw new Error("Constraint ' + name + '/"+arity+" not defined.")',
    indent(1) + '}',
    indent(1),
    indent(1) + 'var constraint = new ' + opts.runtime + '.Constraint("' + name + '", arity, args)',
    indent(1) + 'this.Store.add(constraint)',
    indent(1) + 'this[callConstraint](constraint)',
    indent(1),
    indent(1) + 'return this',
    indent(0) + '}'
  ].join('\n')
}

function generateActivateProperties (opts, constraints) {
  var parts = []

  for (var constraintName in constraints) {
    for (var arity in constraints[constraintName].occurences) {
      parts.push('CHR.prototype._' + constraintName + '_' + arity + '_activate = function (constraint) {')
      for (var i = 1; i < constraints[constraintName].occurences[arity]; i++) {
        parts.push(indent(1) + 'this._' + constraintName + '_' + arity + '_occurence_' + i + '(constraint)')
      }
      parts.push([
        '}',
        ''
      ].join('\n'))
    }
  }

  return parts.join('\n')
}

function generateDummyActivateProperties (opts, constraints) {
  var parts = []

  for (var constraintName in constraints) {
    for (var arity in constraints[constraintName].tell) {
      if (!constraints[constraintName].occurences.hasOwnProperty(arity)) {
        // dummy activator function needed
        parts.push('CHR.prototype._' + constraintName + '_' + arity + '_activate = function (constraint) {}')
      }
    }
  }

  return parts.join('\n')
}
*/

function compileHead (rule, headNo, opts) {
  headNo = headNo || 0
  opts = opts || {}
  opts.this = opts.this || 'this'

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

  parts.push(
    indent(level + 0) + 'var ids = [ ' + ids.join(', ') + ' ]',
    indent(level + 0) + 'if (ids.every(function(id) { return self.Store.alive(id) })) {',
    indent(level + 1) + 'if (self.AllDifferent(ids)) {'
  )
  level += 2

  if (rule.guard.length > 0) {
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

  if (rule.guard.length > 0) {
    level -= 1
    parts.push(indent(level) + '}')
  }

  level -= 2
  parts.push(
    indent(1) + '}',
    indent(0) + '}'
  )

  for (j = rule.head.length - 1; j >= 0; j--) {
    if (j === headNo) {
      continue
    }

    level--
    parts.push(indent(level) + '})')
  }

  return parts
}

function generateGuards (opts, rule) {
  var expr = 'if ('
  expr += rule.guard.map(function (guard) {
    return generateGuard(opts, guard)
  }).join(' && ')
  expr += ') {'
  return expr
}

function generateGuard (opts, guard) {
  if (guard.type === 'BinaryExpression') {
    return generateBinaryExpression(opts, guard)
  }

  if (guard.type === 'Replacement') {
    return 'self.Replacements[' + guard.num + '].call(self)'
  }

  return 'false'
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
    return 'self.Replacements[' + body.num + '].call(self)'
  }

  expr += [
    'if (!(' + generateBinaryExpression(opts, body) + ')) {',
    indent(1) + 'self.Store.invalidate()',
    indent(1) + 'return',
    '}'
  ].join('\n')
  return expr
}
/*
function setTell (constraints, c) {
  if (!constraints[c.name]) {
    constraints[c.name] = {
      occurences: {},
      tell: {}
    }
  }

  constraints[c.name].tell[c.arity] = true
}
*/
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

function indent (level, text, spaces) {
  level = level || 0
  if (typeof text === 'number') {
    spaces = text
    text = null
  }
  spaces = spaces || 2
  text = text || null

  if (text && typeof text === 'string') {
    return text.split('\n').map(function (row) {
      return indent(level, spaces) + row
    }).join('\n')
  } else if (text && text instanceof Array) {
    return text.map(indentBy(level, spaces))
  }

  return Array(level * spaces + 1).join(' ')
}

function indentBy (level, spaces) {
  return function (str) {
    return indent(level, spaces) + str
  }
}

function destructuring (constraint, to) {
  var parts = []
  constraint.parameters.forEach(function (parameter, i) {
    if (parameter.type === 'Literal') {
      parts.push(indent(0) + 'if (' + to + '[' + i + '] !== ' + escape(parameter.value) + ') {')
      parts.push(indent(1) + 'return')
      parts.push(indent(0) + '}')
      return
    }

    parts.push('var ' + parameter.name + ' = ' + to + '[' + i + ']')
  })
  return parts
}

function escape (val) {
  if (typeof val === 'string') {
    return '"' + val + '"'
  }

  return val
}
