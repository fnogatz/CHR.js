module.exports = Rule

var uuid = require('uuid').v1

var HeadCompiler = require('./compile/head')

function Rule (ruleObj, opts) {
  if (typeof ruleObj.name === 'undefined') {
    ruleObj.name = '_' + uuid()
  }

  opts = opts || {}
  opts.globalReplacements = opts.replacements || {}

  this.Scope = opts.scope || {}
  this._source = ruleObj

  this.Replacements = {}
  this._setReplacements(opts.globalReplacements)

  this.Name = ruleObj.name

  this._compile(ruleObj)
}

Rule.prototype._compile = function compileRule (ruleObj) {
  var self = this

  var head
  var body
  var compiled

  var headCompiler = new HeadCompiler(ruleObj, {
    replacements: self.Replacements,
    scope: self.Scope
  })

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

    if (!this[body.functor]) {
      this[body.functor] = []
    }
  }
}

Rule.prototype._addConstraintCaller = function (functor, compiled) {
  // create a new function with a single parameter "constraint"
  var compiledFunction = new Function('constraint', 'replacements', compiled) // eslint-disable-line

  if (!this[functor]) {
    this[functor] = []
  }

  this[functor].push(compiledFunction)
}

Rule.prototype._setReplacements = function (globalReplacements) {
  var self = this

  ;['guard', 'body'].forEach(function (location) {
    self._source[location] = self._source[location].map(function (el) {
      if (el.type !== 'Replacement') {
        return el
      }

      var replacementId

      if (el.hasOwnProperty('num')) {
        replacementId = el.num
        if (!globalReplacements[replacementId]) {
          throw new Error('There is no replacement with number ' + replacementId)
        }

        self.Replacements[replacementId] = globalReplacements[replacementId]
        return el
      }

      if (el.hasOwnProperty('expr') && globalReplacements && globalReplacements.length > 0) {
        // attention: this mutates the globalReplacement parameter!
        var replacement = globalReplacements.shift()

        // get free uuid
        replacementId = uuid()
        self.Replacements[replacementId] = replacement

        // adapt source object
        var newElement = {
          type: 'Replacement',
          num: replacementId
        }

        return newElement
      }

      return el
    })
  })
}

Rule.prototype.fire = function fireConstraint (chr, constraint) {
  var replacements = this.Replacements

  this[constraint.functor].forEach(function (occurence) {
    occurence.call(chr, constraint, replacements)
  })
}

Rule.prototype.toString = function toString () {
  // TODO
  return '[TODO]'
}
