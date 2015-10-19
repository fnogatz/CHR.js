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
    helper: opts.helper || 'self.Helper',
    defaultCallbackNames: opts.defaultCallbackNames || [ 'cb', 'callback' ]
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
  var level = 0

  parts.push(
    indent(level) + 'var self = ' + opts.this,
    indent(level) + ''
  )

  if (constraint.arity > 0) {
    parts = parts.concat(destructuring(constraint, 'constraint.args').map(indentBy(level)))
    parts.push(
      indent(level)
    )
  }

  // start:def_constraintIds
  parts.push(
    indent(level) + 'var constraintIds = ['
  )

  rule.head.forEach(function (head, headIndex) {
    var line = headIndex === 0 ? indent(1) : ', '
    if (headIndex === headNo) {
      line += '[ constraint.id ]'
    } else {
      line += 'self.Store.lookup("' + head.name + '", ' + head.arity + ')'
    }
    parts.push(
      indent(level) + line
    )
  })

  parts.push(
    indent(level) + ']',
    indent(level) + ''
  )
  // end:def_constraintIds

  // start:return_promise
  parts.push(
    indent(level) + 'return new Promise(function (resolve, reject) {'
  )
  level += 1

  // start:def_iterator
  parts.push(
    indent(level) + this.opts.helper + '.forEach(constraintIds, function iterateConstraint (ids, callback) {'
  )
  level += 1

  // start:test_allAlive
  parts.push(
    indent(level) + 'if (!self.Store.allAlive(ids))',
    indent(level) + '  return callback()',
    indent(level)
  )
  // end:test_allAlive

  // start:test_ruleFired
  parts.push(
    indent(level) + 'if (self.History.has("' + rule.name + '", ids))',
    indent(level) + '  return callback()',
    indent(level)
  )
  // end:test_ruleFired

  // start:destructuring_other_constraints
  rule.head.forEach(function (head, headIndex) {
    if (headIndex === headNo) {
      return
    }

    if (head.arity > 0) {
      parts = parts.concat(destructuring(head, 'self.Store.args(ids[' + headIndex + '])').map(indentBy(level)))
      parts.push(
        indent(level)
      )
    }
  })
  // end:destructuring_other_constraints

  // start:guards_promises
  // generates something like:
  //   var guards = []
  if (rule.guard && rule.guard.length > 0) {
    parts = parts.concat(
      this.generateGuardPromisesArray().map(indentBy(level))
    )
    parts.push(
      indent(level) + 'Promise.all(guards)',
      indent(level) + '.then(function () {'
    )
    level += 1
  }

  parts.push(
    indent(level) + 'self.History.add("' + rule.name + '", ids)'
  )
  for (var k = rule.r + 1; k <= rule.head.length; k++) {
    // remove constraints
    parts.push(
      indent(level) + 'self.Store.kill(ids[' + (k - 1) + '])'
    )
  }

  // start:tells
  if (rule.body.length > 0) {
    parts.push(
      indent(level)
    )
    parts = parts.concat(self.generateTellPromises().map(indentBy(level)))
  } else {
    parts.push(
      indent(level) + 'callback()'
    )
  }
  // end: tells

  if (rule.guard && rule.guard.length > 0) {
    level -= 1
    parts.push(
      indent(level) + '})',
      indent(level) + '.catch(function () {',
      indent(level + 1) + ' callback()',
      indent(level) + '})'
    )
  }
  // end:guards_promises

  level -= 1
  parts.push(
    indent(level) + '}, resolve)'
  )
  // end:def_iterator

  level -= 1
  parts.push('})')
  // end:return_promise

  return parts
}

Compiler.prototype.generateGuardPromisesArray = function generateGuardPromisesArray () {
  var self = this
  var parts = []

  parts.push(
    'var guards = ['
  )

  this.rule.guard.forEach(function (guard, guardIndex) {
    var expr = guardIndex === 0 ? indent(1) : ', '

    if (guard.type === 'Replacement' && guard.hasOwnProperty('num')) {
      // get parameters via dependency injection
      var params = util.getFunctionParameters(self.replacements[guard.num])
      var lastParamName = util.getLastParamName(params)
      parts.push(
        expr + 'new Promise(function (s, j) {',
        indent(2) + 'var ' + lastParamName + ' = function (r) { r ? s() : j() }',
        indent(2) + 'replacements["' + guard.num + '"].apply(self, [' + params + '])',
        indent(1) + '})'
      )

      return
    }

    if (guard.type === 'Replacement' && guard.hasOwnProperty('expr')) {
      parts = parts.concat(fakeScope(self.scope, guard.expr.original, { isGuard: true }).map(function (row, rowId) {
        if (rowId === 0) {
          return expr + row
        }
        return indent(1) + row
      }))
      return
    }

    parts.push(
      expr + 'new Promise(function (s, j) { (' + self.generateGuard(guard) + ') ? s() : j() })'
    )
  })

  parts.push(
    ']',
    ''
  )

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

Compiler.prototype.generateTellPromises = function generateTellPromises () {
  var self = this
  var parts = []

  parts.push('Promise.resolve()')

  this.rule.body.forEach(function (body, bodyIndex) {
    if (body.type === 'Constraint' && body.name === 'true' && body.arity === 0) {
      return
    }

    parts.push('.then(function () {')

    if (body.type === 'Constraint') {
      var expr = indent(1) + 'return self.' + body.name + '('
      expr += body.parameters.map(function (parameter) {
        return self.generateExpression(parameter)
      }).join(', ')
      expr += ')'
      parts.push(expr)
      parts.push('})')
      return
    }

    if (body.type === 'Replacement' && body.hasOwnProperty('expr')) {
      parts = parts.concat(fakeScope(self.scope, body.expr.original).map(function (row, rowId) {
        if (rowId === 0) {
          return 'return ' + row
        }
        return indent(1) + row
      }))
      parts.push('})')
      return
    }

    var params
    var lastParamName

    if (body.type === 'Replacement' && body.hasOwnProperty('num')) {
      // get parameters via dependency injection
      params = util.getFunctionParameters(self.replacements[body.num])
      lastParamName = util.getLastParamName(params)

      if (lastParamName && self.opts.defaultCallbackNames.indexOf(lastParamName) > -1) {
        // async
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + 'var ' + lastParamName + ' = s',
          indent(2) + 'replacements["' + body.num + '"].apply(self, [' + params + '])',
          indent(1) + '})',
          '})'
        )
      } else {
        // sync
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + 'replacements["' + body.num + '"].apply(self, [' + params + '])',
          indent(2) + 's()',
          indent(1) + '})',
          '})'
        )
      }
      return
    }

    if (body.type === 'Replacement' && body.hasOwnProperty('func')) {
      var func = eval(body.func) // eslint-disable-line
      params = util.getFunctionParameters(func)
      lastParamName = util.getLastParamName(params, true)

      if (lastParamName && self.opts.defaultCallbackNames.indexOf(lastParamName) > -1) {
        // async
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + '(' + body.func + ').apply(self, [' + util.replaceLastParam(params, 's') + '])',
          indent(1) + '})',
          '})'
        )
      } else {
        // sync
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + '(' + body.func + ').apply(self, [' + params + '])',
          indent(2) + 's()',
          indent(1) + '})',
          '})'
        )
      }

      return
    }
  })

  parts.push(
    '.then(function () {',
    indent(1) + 'callback()',
    '})',
    '.catch(function() {',
    indent(1) + 'reject()',
    '})'
  )

  return parts
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
