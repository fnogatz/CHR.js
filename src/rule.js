module.exports = Rule

var uuid = require('uuid').v4

var compileHead = require('./compile/head')

function Rule (ruleObj) {
  if (typeof ruleObj.name === 'undefined') {
    ruleObj.name = '_' + uuid()
  }

  this._source = ruleObj
  this.Constraints = {}

  this.Name = ruleObj.name

  this._compile(ruleObj)
}

Rule.prototype._compile = function compileRule (ruleObj) {
  var head
  var body
  var compiled

  for (var headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
    head = ruleObj.head[headNo]

    compiled = compileHead(ruleObj, headNo).join('\n')
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
  var compiledFunction = new Function('constraint', compiled) // eslint-disable-line
  compiledFunction.toString = function () {
    return 'function (constraint) {\n' + compiled + '}'
  }

  if (!this.Constraints[functor]) {
    this.Constraints[functor] = []
  }

  this.Constraints[functor].push(compiledFunction)
}

Rule.prototype.fire = function fireConstraint (chr, constraint) {
  this.Constraints[constraint.functor].forEach(function (occurence) {
    occurence.call(chr, constraint)
  })
}

Rule.prototype.toString = function toString () {
  // TODO
  return '[TODO]'
}
