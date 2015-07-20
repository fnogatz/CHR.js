module.exports = transform
module.exports.fromFile = transformFile
module.exports.head = compileHead

var fs = require('fs')

var parse = require('./parser').parse

function transform (program, opts) {
  opts = opts || {}
  opts.exports = opts.exports || 'module.exports'
  opts.runtime = opts.runtime || 'require("chr/runtime")'

  var parsed = parse(program, {
    startRule: 'ProgramWithPreamble'
  })

  var parts = []

  parts.push(
    'var Runtime = ' + opts.runtime,
    ''
  )

  parts.push(opts.exports + ' = (function() {')
  var level = 1

  if (parsed.preamble) {
    parts.push(indent(level) + parsed.preamble)
    parts.push(indent(level))
  }

  var constraints = {}
  var constraintNames = {}
  var replacements = []

  var rules = parsed.body
  rules.forEach(function (rule) {
    var head
    var functor
    var compiled

    rule.constraints.forEach(function (functor) {
      var name = functor.split('/')[0]
      constraintNames[name] = true

      if (!constraints[functor]) {
        constraints[functor] = []
      }
    })

    // replace replacements
    ;['guard', 'body'].forEach(function (location) {
      rule[location] = rule[location].map(function (element) {
        if (element.type !== 'Replacement' || !element.hasOwnProperty('original')) {
          return element
        }

        var src = element.original
        if (location === 'guard') {
          src = 'return ' + src
        }

        var replacementId = replacements.push(src) - 1
        var newElement = {
          type: 'Replacement',
          num: replacementId
        }
        return newElement
      })
    })

    for (var headNo = rule.head.length - 1; headNo >= 0; headNo--) {
      head = rule.head[headNo]
      functor = head.name + '/' + head.arity

      compiled = compileHead(rule, headNo, {
        helper: 'Runtime.Helper'
      })
      constraints[functor].push(compiled)
    }
  })

  parts.push(
    indent(level) + 'var _activators = {}',
    indent(level)
  )

  var activates
  for (var functor in constraints) {
    activates = []

    constraints[functor].forEach(function (occurenceFunctionSource, occurence) {
      var functionName = '_' + functor.replace('/', '_') + '_' + occurence
      activates.push(functionName)

      parts.push(indent(level) + 'function ' + functionName + ' (constraint) {')
      parts = parts.concat(occurenceFunctionSource.map(indentBy(level + 1)))
      parts.push(
        indent(level) + '}',
        indent(level)
      )
    })

    parts.push(indent(level) + '_activators.' + functor.replace('/', '_') + ' = function (constraint) {')
    activates.map(function (activatorName) {
      parts.push(indent(level + 1) + activatorName + '.call(chr, constraint)')
    })
    parts.push(
      indent(level) + '}',
      indent(level)
    )
  }

  parts = parts.concat(generateObject(opts, constraints, replacements).map(indentBy(level)))
  parts.push(indent(level))

  for (var constraintName in constraintNames) {
    parts = parts.concat(generateCaller(opts, constraintName).map(indentBy(level)))
    parts.push(indent(level))
  }

  parts.push(
    indent(level) + 'return chr',
    '})()'
  )

  return parts.join('\n')
}

function generateObject (opts, constraints, replacements) {
  var parts = []

  parts.push(
    indent(0) + 'var chr = {',
    indent(1) + 'Store: new Runtime.Store(),',
    indent(1) + 'History: new Runtime.History(),',
    indent(1) + 'Constraints: {'
  )

  var functorNo = 0
  for (var functor in constraints) {
    parts.push((functorNo++ > 0 ? indent(1) + ', ' : indent(2)) + '"' + functor + '": [')
    constraints[functor].forEach(function (o, occurence) {
      parts.push((occurence > 0 ? indent(2) + ', ' : indent(3)) + '_' + functor.replace('/', '_') + '_' + occurence + '.bind(chr)')
    })
    parts.push(indent(2) + ']')
  }

  parts.push(
    indent(1) + '},',
    indent(1) + 'Replacements: ['
  )

  replacements.forEach(function (replacement, ix) {
    parts.push(
      (ix > 0 ? ', ' + indent(1) : indent(2)) + 'function () {',
      indent(3) + replacement,
      indent(2) + '}'
    )
  })

  parts.push(
    indent(1) + ']',
    indent(0) + '}'
  )

  return parts
}

function generateCaller (opts, name) {
  var parts = []

  parts.push(
    indent(0) + 'chr.' + name + ' = function() {',
    indent(1) + 'var self = this',
    indent(1),
    indent(1) + 'var args = Array.prototype.slice.call(arguments)',
    indent(1) + 'var arity = arguments.length',
    indent(1) + 'var functor = "' + name + '/" + arity',
    indent(1),
    indent(1) + 'if (!self.Constraints[functor]) {',
    indent(2) + 'throw new Error("Constraint "+functor+" not defined.")',
    indent(1) + '}',
    indent(1),
    indent(1) + 'var constraint = new Runtime.Constraint("' + name + ' ", arity, args)',
    indent(1) + 'self.Store.add(constraint)',
    indent(1) + '_activators[functor.replace("/","_")].call(chr, constraint)',
    indent(0) + '}'
  )

  return parts
}

function transformFile (filename, opts, callback) {
  fs.readFile(filename, 'utf8', function (err, code) {
    if (err) {
      return callback(err)
    }

    var result
    try {
      result = transform(code, opts)
    } catch (err) {
      return callback(err)
    }

    return callback(null, result)
  })
}

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

  parts.push(
    indent(level + 0) + 'var ids = [ ' + ids.join(', ') + ' ]',
    indent(level + 0) + 'if (ids.every(function(id) { return self.Store.alive(id) })) {',
    indent(level + 1) + 'if (' + opts.helper + '.allDifferent(ids)) {'
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
