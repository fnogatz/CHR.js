module.exports = {
  History: require('./src/history'),
  Store: require('./src/store'),
  Constraint: require('./src/constraint'),
  Helper: {
    allDifferent: allDifferent
  }
}

function allDifferent (arr) {
  return arr.every(function (el1, ix) {
    return arr.slice(ix + 1).every(function (el2) {
      return el1 != el2 // eslint-disable-line eqeqeq
    })
  })
}
