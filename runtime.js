var History = require('./src/history')
var Store = require('./src/store')
var Constraint = require('./src/constraint')

module.exports = {
  History: History,
  Store: Store,
  Constraint: Constraint,
  Helper: {
    allDifferent: allDifferent,
    dynamicCaller: dynamicCaller
  }
}

function allDifferent (arr) {
  return arr.every(function (el1, ix) {
    return arr.slice(ix + 1).every(function (el2) {
      return el1 != el2 // eslint-disable-line eqeqeq
    })
  })
}

function dynamicCaller (name) {
  return function () {
    var self = this

    var args = Array.prototype.slice.call(arguments)
    var arity = arguments.length
    var functor = name + '/' + arity

    if (!self.Constraints[functor]) {
      throw new Error('Constraint ' + name + '/' + arity + ' not defined.')
    }

    var constraint = new Constraint(name, arity, args)
    self.Store.add(constraint)

    self.Constraints[functor].forEach(function (occurence) {
      occurence.call(self, constraint)
    })
  }
}
