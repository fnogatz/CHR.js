module.exports = fakeScope

var util = require('./util')
var indent = util.indent

function fakeScope (scope, expr, isGuard) {
  // evaluate expression to get the function parameters
  // via dependency injection
  with (scope) {
    var func = eval('('+expr+')')
  }

  var params = util.getFunctionParameters(func || function() {})

  var parts = [
    indent(0) + (isGuard ? '' : ';') + '(function () {',
    indent(1) + 'with (self.Scope) {',
    indent(2) + (isGuard ? 'return ' : ';') + '(' + expr + ').apply(self, [' + params + '])',
    indent(1) + '}',
    indent(0) + '}())'
  ]

  if (isGuard) {
    return parts.map(function(str) {
      return str.trim()
    }).join('')
  }

  return parts
}


