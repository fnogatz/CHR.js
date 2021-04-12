module.exports = dynamicCaller

const Constraint = require('./constraint')

function dynamicCaller (name) {
  return function () {
    const args = Array.prototype.slice.call(arguments)
    const arity = arguments.length
    const functor = name + '/' + arity

    if (typeof this.Constraints[functor] === 'undefined') {
      throw new Error('Constraint ' + functor + ' not defined.')
    }

    const constraint = new Constraint(name, arity, args)
    this.Store.add(constraint)

    const rules = []
    this.Rules.ForEach(function (rule) {
      if (rule[functor]) {
        rules.push(rule)
      }
    })

    const self = this

    return rules.reduce(function (curr, rule) {
      return curr.then(function () {
        return rule.Fire(self, constraint)
      })
    }, Promise.resolve())
  }
}
