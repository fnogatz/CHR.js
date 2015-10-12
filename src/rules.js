module.exports = Rules

var dynamicCaller = require('./dynamic-caller')
var Rule = require('./rule')

function Rules (chr) {
  this._chr = chr

  this.Order = []
}

Rules.prototype.Add = function addRule (ruleObj, globalReplacements) {
  var self = this

  var rule = new Rule(ruleObj, {
    replacements: globalReplacements,
    scope: self._chr.Scope
  })
  var ruleName = rule.Name

  if (this.hasOwnProperty(ruleName)) {
    throw new Error('Rule with name "' + ruleName + '" multiple times specified')
  }

  this[ruleName] = rule
  this.Order.push(rule.Name)

  var constraintName
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
  var self = this
  var chr = this._chr

  var constraintName
  for (var functor in chr.Constraints) {
    constraintName = functor.split('/')[0]
    if (chr.hasOwnProperty(constraintName)) {
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
  var self = this

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
