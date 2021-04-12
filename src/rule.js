module.exports = Rule

const uuid = require('uuid').v1

const HeadCompiler = require('./compile/head')

function Rule (ruleObj, opts) {
  if (typeof ruleObj.name === 'undefined') {
    ruleObj.name = '_' + uuid()
  }

  opts = opts || {}
  opts.globalReplacements = opts.replacements || {}
  opts.breakpoints = opts.breakpoints || false

  this.Scope = opts.scope || {}
  this._source = ruleObj

  this.Replacements = {}
  this._setReplacements(opts.globalReplacements)

  this.Name = ruleObj.name

  this.Breakpoints = {
    onTry: undefined
  }

  this._compile(ruleObj)
}

Rule.prototype._compile = function compileRule (ruleObj) {
  const self = this

  let head
  let compiled

  const headCompiler = new HeadCompiler(ruleObj, {
    replacements: self.Replacements,
    scope: self.Scope
  })

  for (let headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
    head = ruleObj.head[headNo]

    compiled = headCompiler.headNo(headNo).map(function (row) {
      return '  ' + row
    }).join('\n')

    this._addConstraintCaller(head.functor, compiled, {
      location: head.location
    })
  }
}

Rule.prototype._addConstraintCaller = function (functor, compiled, data) {
  data = data || {}

  // create a new function with a single parameter "constraint"
  try {
    var compiledFunction = new Function('constraint', 'replacements', compiled) // eslint-disable-line
  } catch (e) {
    console.log('Compiled source:')
    console.log(compiled)
    throw e
  }

  for (const key in data) {
    compiledFunction[key] = data[key]
  }

  if (!this[functor]) {
    this[functor] = []
  }

  this[functor].push(compiledFunction)
}

Rule.prototype._setReplacements = function (globalReplacements) {
  const self = this

  ;['guard', 'body'].forEach(function (location) {
    self._source[location] = self._source[location].map(function (el) {
      if (el.type !== 'Replacement') {
        return el
      }

      let replacementId

      if (typeof el.num !== 'undefined') {
        replacementId = el.num
        if (!globalReplacements[replacementId]) {
          throw new Error('There is no replacement with number ' + replacementId)
        }

        self.Replacements[replacementId] = globalReplacements[replacementId]
        return el
      }

      if (typeof el.expr !== 'undefined' && globalReplacements && globalReplacements.length > 0) {
        // attention: this mutates the globalReplacement parameter!
        const replacement = globalReplacements.shift()

        // get free uuid
        replacementId = uuid()
        self.Replacements[replacementId] = replacement

        // adapt source object
        const newElement = {
          type: 'Replacement',
          num: replacementId
        }

        return newElement
      }

      return el
    })
  })
}

Rule.prototype.ForEach = function forEach (callback, thisArg) {
  const self = this

  for (const functor in self) {
    if (!functor.match(/^[a-z]/)) {
      continue
    }

    callback.call(thisArg, self[functor])
  }
}

Rule.prototype.Fire = function fireConstraint (chr, constraint) {
  const self = this
  const replacements = this.Replacements

  return Promise.resolve().then(callback2Promise({
    event: 'rule:try',
    rule: self.Name,
    location: self._source.location,
    constraint: constraint
  }, this.Breakpoints.onTry)).then(function () {
    const occurrences = self[constraint.functor].length - 1

    return self[constraint.functor].reduce(function (promise, occurrence, ix) {
      return promise.then(callback2Promise({
        event: 'rule:try-occurrence',
        rule: self.Name,
        occurrence: occurrences - ix,
        constraint: constraint,
        location: occurrence.location
      }, occurrence.onTry)).then(function () {
        return occurrence.call(chr, constraint, replacements)
      })
    }, Promise.resolve())
  })
}

function callback2Promise () {
  const f = Array.prototype.slice.call(arguments, -1)[0]
  if (!f) {
    return function () {
      return Promise.resolve()
    }
  }

  const self = this
  const data = Array.prototype.slice.call(arguments, 0, -1)
  return function () {
    return new Promise(function (resolve) {
      data.push(resolve)
      f.apply(self, data)
    })
  }
}
