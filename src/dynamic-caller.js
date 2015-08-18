module.exports = dynamicCaller

var Constraint = require('./constraint')

function dynamicCaller (name) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var arity = arguments.length
    var functor = name + '/' + arity

    if (typeof this.Constraints[functor] === 'undefined') {
      throw new Error('Constraint ' + functor + ' not defined.')
    }

    var constraint = new Constraint(name, arity, args)
    this.Store.add(constraint)

    var rules = []
    this.Rules.ForEach(function (rule) {
      if (rule[functor]) {
        rules.push(rule)
      }
    })

    var self = this

    return rules.reduce(function (curr, rule) {
      return curr.then(function () {
        return rule.Fire(self, constraint)
      })
    }, Promise.resolve())
  }
}
