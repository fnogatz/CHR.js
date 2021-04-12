module.exports = transform
module.exports.Compiler = Compiler

const fs = require('fs')
const path = require('path')

const parse = require('../parser.peg.js').parse
const util = require('./util')

const version = require('../../package.json').version

const indent = util.indent
const indentBy = util.indentBy
const destructuring = util.destructuring
const escape = util.escape

function transform (program, opts) {
  const compiler = new Compiler(program, opts)
  return compiler.compile()
}

function Compiler (program, opts) {
  opts = opts || {}
  opts.binding = opts.binding || 'module.exports'
  this.opts = opts

  const parsed = parse(program, {
    startRule: 'ProgramWithPreamble'
  })

  this.parsed = parsed
  this.parts = []

  this.constraints = {}
  this.nextRuleId = 0
}

Compiler.prototype.compile = function () {
  const self = this

  this.parts = []

  // add notice
  this.addNotice()

  // add optional preamble
  if (this.parsed.preamble) {
    this.parts.push(
      this.parsed.preamble,
      ''
    )
  }

  if (this.opts.function) {
    this.parts.push(
      indent(0) + 'function ' + this.opts.function + ' () {',
      ''
    )
  } else {
    this.parts.push(
      indent(0) + this.opts.binding + ' = (function () {',
      ''
    )
  }

  const l = 1

  this.addStatics(l)

  // handle all rules
  const rules = this.parsed.body
  rules.forEach(function (ruleObj) {
    // add unique id
    ruleObj._id = self.nextRuleId
    self.nextRuleId++

    // remember constraint names and arity
    ruleObj.constraints.forEach(function (functor) {
      if (Compiler.isBuiltIn(functor)) {
        return
      }

      // add callers if not present
      const p = functor.split('/')
      const name = p[0]
      const arity = p[1]
      if (typeof self.constraints[name] === 'undefined') {
        self.constraints[name] = {}
      }
      if (typeof self.constraints[name][arity] === 'undefined') {
        self.constraints[name][arity] = 0
      }
    })

    // add functions
    for (let headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
      self.addHeadFunction(1, ruleObj, headNo)
    }
  })

  this.addLastHeadFunctions(1)
  this.addConstraintCallers(1)
  this.addConstraintProperties(1)

  this.parts.push(
    indent(1) + 'return chr',
    indent(0) + '}' + (this.opts.function ? '' : ')()')
  )

  return this.parts.join('\n')
}

Compiler.prototype.addNotice = function (level) {
  const l = level || 0

  this.parts.push(
    indent(l) + '/**',
    indent(l) + '  *',
    indent(l) + '  *  Automatically generated',
    indent(l) + '  *  Do not edit',
    indent(l) + '  *',
    indent(l) + '  *  Created using CHR.js AOT compiler',
    indent(l) + '  *  (CHR.js version v' + version + ')',
    indent(l) + '  *  http://github.com/fnogatz/CHR.js',
    indent(l) + '  *',
    indent(l) + '  */',
    ''
  )
}

Compiler.prototype.addStatics = function (level) {
  const l = level || 0

  const statics = fs.readFileSync(path.join(__dirname, 'optimized-statics.js'), 'utf8')
  this.parts = this.parts.concat(statics.split('\n').map(indentBy(l)))
}

Compiler.prototype.addHeadFunction = function (level, ruleObj, headNo) {
  const self = this
  let l = level || 0
  let _str // only temp str
  let _sthAdded = false

  const head = ruleObj.head[headNo]
  const functor = head.functor
  const p = functor.split('/')
  const name = p[0]
  const arity = p[1]
  const no = this.constraints[name][arity]

  let _currentConstraintGetsRemoved = false
  let _hadLookup = false
  let _breakCmds

  this.parts.push(
    indent(l) + 'function ' + Compiler.getContinuationReference(name, arity, no) + ' (constraint, __n) {',
    indent(l) + '  __n = __n || 0',
    ''
  )
  l++

  if (head.arity > 0) {
    _breakCmds = Compiler.getJumper(name, arity, no, _hadLookup)

    this.parts = this.parts.concat(destructuring(head, 'constraint.args', _breakCmds).map(indentBy(l)))
    this.parts.push(
      ''
    )
  }
  if (ruleObj.head.length > 1) {
    // have to find partner constraints

    // start: constraintPattern
    _str = 'var constraintPattern = [ '
    ruleObj.head.forEach(function (head, headIndex) {
      if (headIndex > 0) {
        _str += ', '
      }

      if (headIndex === headNo) {
        _str += '"_"'
      } else {
        _str += '"' + head.functor + '"'
      }
    })
    _str += ' ]'
    this.parts.push(
      indent(l) + _str
    )
    // end: constraintPattern

    this.parts.push(
      indent(l) + 'var lookupResult = chr.Store.lookupResume(' + ruleObj._id + ', constraintPattern, constraint, __n)',
      indent(l) + 'if (lookupResult === false) {',
      indent(l) + '  constraint.cont = [' + Compiler.getContinuationReference(name, arity, no + 1) + ', 0]',
      indent(l) + '  stack.push(constraint)',
      indent(l) + '  return',
      indent(l) + '}',
      indent(l) + 'var constraints = lookupResult.res',
      ''
    )
    _hadLookup = true

    // start: destructuring_other_constraints
    ruleObj.head.forEach(function (head, headIndex) {
      if (headIndex === headNo) {
        return
      }

      if (head.arity > 0) {
        _breakCmds = Compiler.getJumper(name, arity, no, _hadLookup)
        self.parts = self.parts.concat(destructuring(head, 'constraints[' + headIndex + '].args', _breakCmds).map(indentBy(l)))
        self.parts.push(
          ''
        )
      }
    })
    // end: destructuring_other_constraints
  }

  // start: guards
  if (ruleObj.guard && ruleObj.guard.length > 0) {
    this.addGuards(l, ruleObj, name, arity, no, _hadLookup)
  }
  // end: guards

  /*
  // propagation history might no longer be necessary
  this.parts.push(
    indent(l) + '// TODO: Add to propagation history (possibly)',
    ''
  )
  */

  _sthAdded = false
  // start: remove_constraints
  if (ruleObj.r < ruleObj.head.length) {
    for (let k = ruleObj.r + 1; k <= ruleObj.head.length; k++) {
      if ((k - 1) === headNo) {
        // do nothing here - this is handled
        //   by not adding the active constraint
        //   via cont
        _currentConstraintGetsRemoved = true
      } else {
        // remove constraint from Store
        this.parts.push(
          indent(l) + 'chr.Store.remove(constraints[' + (k - 1) + '])'
        )
        _sthAdded = true
      }
    }
    if (_sthAdded) {
      this.parts.push(
        ''
      )
    }
  }
  // end: remove_constraints

  // start: tells
  if (ruleObj.body.length > 0) {
    ruleObj.body.forEach(function (body) {
      self.addTell(l, body)
    })
  }
  // end: tells

  if (!_currentConstraintGetsRemoved) {
    // put the current constraint back on
    //   the stack and continue

    this.parts = this.parts.concat(Compiler.getJumper(name, arity, no, _hadLookup).map(indentBy(l)))
  } else {
    this.parts.push(
      indent(l) + '// active constraint gets removed'
    )
  }

  l--
  this.parts.push(
    indent(l) + '}',
    ''
  )

  this.constraints[name][arity]++
}

Compiler.prototype.addTell = function (level, body) {
  const self = this
  const l = level || 0

  if (body.type === 'Constraint' && body.name === 'true' && body.arity === 0) {
    return
  }

  if (body.type === 'Constraint') {
    const args = body.parameters.map(function (parameter) {
      return Compiler.generateExpression(parameter)
    }).join(', ')
    this.parts.push(
      indent(l) + ';(function () {', // leading semicolon necessary
      indent(l) + '  var _c = new Constraint("' + body.name + '", ' + body.parameters.length + ', [ ' + args + ' ])',
      indent(l) + '  _c.cont = [' + Compiler.getContinuationReference(body.name, body.parameters.length, 0) + ', 0]',
      indent(l) + '  stack.push(_c)',
      indent(l) + '})()',
      ''
    )
    return
  }

  let params
  let lastParamName

  if (body.type === 'Replacement' && typeof body.num !== 'undefined') {
    // get parameters via dependency injection
    params = util.getFunctionParameters(self.replacements[body.num])
    lastParamName = util.getLastParamName(params)

    // sync
    this.parts.push(
      indent(l) + 'return new Promise(function (s) {',
      indent(l) + '  replacements["' + body.num + '"].apply(self, [' + params + '])',
      indent(l) + '  s()',
      indent(l) + '})'
    )
    return
  }

  if (body.type === 'Replacement' && typeof body.func !== 'undefined') {
    var func = eval(body.func) // eslint-disable-line
    params = util.getFunctionParameters(func)
    lastParamName = util.getLastParamName(params, true)

    if (lastParamName && self.opts.defaultCallbackNames.indexOf(lastParamName) > -1) {
      // sync
      this.parts.push(
        indent(l) + 'return new Promise(function (s) {',
        indent(l) + '  (' + body.func + ').apply(self, [' + params + '])',
        indent(l) + '  s()',
        indent(l) + '})'
      )
    }
  }
}

Compiler.prototype.addLastHeadFunctions = function (level) {
  const self = this
  const l = level || 0

  for (const constraintName in self.constraints) {
    for (const arity in self.constraints[constraintName]) {
      this.parts.push(
        indent(l) + 'function ' + Compiler.getContinuationReference(constraintName, arity, self.constraints[constraintName][arity]) + ' (constraint) {',
        indent(l) + '  constraint.cont = null',
        indent(l) + '  chr.Store.add(constraint)',
        indent(l) + '}',
        ''
      )
    }
  }
}

Compiler.prototype.addConstraintProperties = function (level) {
  const self = this
  const l = level || 0

  // bind callers to `chr` variable
  Object.keys(this.constraints).forEach(function (constraintName) {
    self.parts.push(
      indent(l) + 'chr.' + constraintName + ' = ' + constraintName
    )
  })

  this.parts.push(
    ''
  )
}

Compiler.prototype.addConstraintCallers = function (level) {
  const self = this
  const l = level || 0

  // create functions
  Object.keys(this.constraints).forEach(function (constraintName) {
    self.parts.push(
      indent(l) + 'function ' + constraintName + ' () {',
      indent(l) + '  var args = Array.prototype.slice.call(arguments)',
      indent(l) + '  var arity = arguments.length',
      indent(l) + '  var functor = "' + constraintName + '/" + arity',
      indent(l) + '  var constraint = new Constraint("' + constraintName + '", arity, args)'
    )

    self.addConstraintContinuations(l + 1, constraintName)

    self.parts.push(
      indent(l) + '  stack.push(constraint)',
      '',
      indent(l) + '  trampoline()',
      indent(l) + '}',
      ''
    )
  })
}

Compiler.prototype.addConstraintContinuations = function (level, constraintName) {
  const self = this
  const l = level || 0

  const constraint = this.constraints[constraintName]

  const arities = Object.keys(constraint)
  if (arities.length === 1) {
    self.parts.push(
      indent(l) + 'if (arity === ' + arities[0] + ') {',
      indent(l) + '  constraint.cont = [' + Compiler.getContinuationReference(constraintName, arities[0], 0) + ', ]',
      indent(l) + '} else {',
      indent(l) + '  throw new Error("Undefined constraint: " + functor)',
      indent(l) + '}'
    )
  } else {
    self.parts.push(
      indent(l) + 'switch(arity) {'
    )
    arities.sort(function (a, b) { return a - b }).forEach(function (arity) {
      self.parts.push(
        indent(l + 1) + 'case ' + arity + ':',
        indent(l + 1) + '  constraint.cont = [' + Compiler.getContinuationReference(constraintName, arity, 0) + ', ]',
        indent(l + 1) + '  break'
      )
    })
    self.parts.push(
      indent(l + 1) + 'default:',
      indent(l + 1) + '  throw new Error("Undefined constraint: " + functor)'
    )
    self.parts.push(
      indent(l) + '}'
    )
  }
}

Compiler.prototype.addGuards = function (level, ruleObj, name, arity, no, _hadLookup) {
  const l = level || 0

  let expr = 'if (!('
  const boolExprs = []
  ruleObj.guard.forEach(function (guard) {
    if (guard.type !== 'Replacement') {
      boolExprs.push(Compiler.generateGuard(guard))
    }
  })
  expr += boolExprs.join(' && ')
  expr += ')) {'

  this.parts.push(
    indent(l) + expr
  )
  this.parts = this.parts.concat(Compiler.getJumper(name, arity, no, _hadLookup).map(indentBy(l + 1)))
  this.parts.push(
    indent(l) + '}',
    ''
  )
}

/// ////////////////////////////////////////////////////////

Compiler.isBuiltIn = function (functor) {
  if (functor === 'true/0') { return true }

  return false
}

Compiler.getContinuationReference = function (name, arity, no) {
  return '__' + name + '_' + arity + '_' + no
}

Compiler.getJumper = function (name, arity, no, _hadLookup) {
  const parts = []

  if (_hadLookup === true) {
    parts.push(
      'constraint.cont = [' + Compiler.getContinuationReference(name, arity, no) + ', __n + 1]'
    )
  } else {
    parts.push(
      'constraint.cont = [' + Compiler.getContinuationReference(name, arity, no + 1) + ', 0]'
    )
  }

  parts.push(
    'stack.push(constraint)',
    'return'
  )

  return parts
}

Compiler.generateGuard = function generateGuard (guard) {
  if (guard.type === 'BinaryExpression') {
    return Compiler.generateBinaryExpression(guard)
  }

  return 'false'
}

Compiler.generateBinaryExpression = function generateBinaryExpression (expr) {
  return ['left', 'right'].map(function (part) {
    if (expr[part].type === 'Identifier') {
      return expr[part].name
    }
    if (expr[part].type === 'Literal') {
      return escape(expr[part].value)
    }
    if (expr[part].type === 'BinaryExpression') {
      return '(' + generateBinaryExpression(expr[part]) + ')'
    }
    return ''
  }).join(' ' + expr.operator + ' ')
}

Compiler.generateExpression = function generateExpression (parameter) {
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
