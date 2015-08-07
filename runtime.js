var History = require('./src/history')
var Store = require('./src/store')
var Constraint = require('./src/constraint')
var dynamicCaller = require('./src/dynamic-caller')

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
