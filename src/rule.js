module.exports = Rule

var uuid = require('uuid').v4

var HeadCompiler = require('./compile/head')

function Rule (ruleObj, globalReplacements) {
  if (typeof ruleObj.name === 'undefined') {
    ruleObj.name = '_' + uuid()
  }

  this._source = ruleObj

  this.Replacements = {}
  this._setReplacements(globalReplacements)

  this.Constraints = {}
  this.Name = ruleObj.name

  this._compile(ruleObj)
}

Rule.prototype._compile = function compileRule (ruleObj) {
  var head
  var body
  var compiled

  var headCompiler = new HeadCompiler(ruleObj, this.Replacements)

  for (var headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
    head = ruleObj.head[headNo]

    compiled = headCompiler.headNo(headNo).join('\n')
    this._addConstraintCaller(head.functor, compiled)
  }

  for (var bodyNo = 0; bodyNo < ruleObj.body.length; bodyNo++) {
    body = ruleObj.body[bodyNo]

    if (body.type !== 'Constraint') {
      continue
    }

    if (!this.Constraints[body.functor]) {
      this.Constraints[body.functor] = []
    }
  }
}

Rule.prototype._addConstraintCaller = function (functor, compiled) {
  // create a new function with a single parameter "constraint"
  var compiledFunction = new Function('constraint', 'replacements', compiled) // eslint-disable-line

  compiledFunction.toString = function () {
    return 'function (constraint, replacements) {\n' + compiled + '}'
  }

  if (!this.Constraints[functor]) {
    this.Constraints[functor] = []
  }

  this.Constraints[functor].push(compiledFunction)
}

Rule.prototype._setReplacements = function (globalReplacements) {
  var self = this

  this._source.replacements.forEach(function (replacement) {
    if (!replacement.hasOwnProperty('num')) {
      return
    }

    var num = replacement.num
    if (!globalReplacements[num]) {
      throw new Error('There is no replacement with number ' + num)
    }

    self.Replacements[num] = globalReplacements[num]
  })
}

Rule.prototype.fire = function fireConstraint (chr, constraint) {
  var replacements = this.Replacements

  this.Constraints[constraint.functor].forEach(function (occurence) {
    occurence.call(chr, constraint, replacements)
  })
}

Rule.prototype.toString = function toString () {
  // TODO
  return '[TODO]'
}
