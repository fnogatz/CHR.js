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
    dynamicCaller: dynamicCaller,
    forEach: forEach
  }
}

function allDifferent (arr) {
  return arr.every(function (el1, ix) {
    return arr.slice(ix + 1).every(function (el2) {
      return el1 != el2 // eslint-disable-line eqeqeq
    })
  })
}

function forEach (arr, iterator, onEnd) {
  var indexes = Array.apply(null, Array(arr.length)).map(Number.prototype.valueOf, 0)
  forEachOnIndex(arr, indexes, iterator, onEnd)
}

function forEachOnIndex (arr, indexes, iterator, onEnd) {
  var iterablePosition = -1
  var values = []
  var value
  var ix

  var disjoint = true
  for (var position = 0; position < indexes.length; position++) {
    ix = indexes[position]

    if (typeof arr[position][ix] === 'undefined') {
      return onEnd()
    }
    value = arr[position][ix].toString()

    if (ix < arr[position].length - 1) {
      iterablePosition = position
    }

    if (values.indexOf(value) >= 0) {
      disjoint = false
      break
    }

    values.push(value)
  }

  function next () {
    if (iterablePosition === -1) {
      return onEnd()
    }

    // calculate next indexes
    if (iterablePosition > -1) {
      indexes[iterablePosition] += 1
      for (var ix = iterablePosition + 1; ix < indexes.length; ix++) {
        indexes[ix] = 0
      }
    }

    forEachOnIndex(arr, indexes, iterator, onEnd)
  }

  if (!disjoint) {
    return next()
  }

  iterator(values, next)
}
