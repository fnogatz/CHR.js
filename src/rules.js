module.exports = Rules

var dynamicCaller = require('./dynamic-caller')
var Rule = require('./rule')

function Rules (chr) {
  this._chr = chr

  this.Order = []
}

Rules.prototype.Add = function addRule (ruleObj) {
  var self = this

  var rule = new Rule(ruleObj)
  var ruleName = rule.Name

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

Rules.prototype.forEach = function forEach (callback, thisArg) {
  var self = this

  this.Order.forEach(function (ruleName) {
    callback.call(thisArg, self[ruleName])
  })
}
