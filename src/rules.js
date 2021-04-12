module.exports = Rules

const dynamicCaller = require('./dynamic-caller')
const Rule = require('./rule')

function Rules (chr) {
  this._chr = chr

  this.Order = []
}

Rules.prototype.Add = function addRule (ruleObj, globalReplacements) {
  const self = this

  const rule = new Rule(ruleObj, {
    replacements: globalReplacements,
    scope: self._chr.Scope
  })
  const ruleName = rule.Name

  if (typeof this[ruleName] !== 'undefined') {
    throw new Error('Rule with name "' + ruleName + '" multiple times specified')
  }

  this[ruleName] = rule
  this.Order.push(rule.Name)

  let constraintName
  ruleObj.constraints.forEach(function (functor) {
    // add callers if not present
    constraintName = functor.split('/')[0]
    if (!self._chr[constraintName]) {
      self._chr[constraintName] = dynamicCaller(constraintName).bind(self._chr)
    }

    if (!self._chr[functor]) {
      self._chr.Constraints[functor] = []
    }
  })

  ruleObj.head.forEach(function (constraint) {
    self._chr.Constraints[constraint.functor].push(ruleName)
  })
}

Rules.prototype.Reset = function reset () {
  const self = this
  const chr = this._chr

  let constraintName
  for (const functor in chr.Constraints) {
    constraintName = functor.split('/')[0]
    if (typeof chr[constraintName] !== 'undefined') {
      delete chr[constraintName]
    }
  }
  chr.Constraints = {}

  this.ForEach(function (rule) {
    delete self[rule.Name]
  })
  this.Order = []
}

Rules.prototype.ForEach = function forEach (callback, thisArg) {
  const self = this

  this.Order.forEach(function (ruleName) {
    callback.call(thisArg, self[ruleName])
  })
}

Rules.prototype.SetBreakpoints = function setBreakpoints (f) {
  this.ForEach(function (rule) {
    rule.Breakpoints.onTry = f

    rule.ForEach(function (occurrences) {
      occurrences.forEach(function (occurrence) {
        occurrence.onTry = f
      })
    })
  })
}

Rules.prototype.RemoveBreakpoints = function removeBreakpoints (f) {
  this.SetBreakpoints(undefined)
}
