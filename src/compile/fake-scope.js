module.exports = fakeScope

var util = require('./util')
var indent = util.indent

function fakeScope (scope, expr, opts) {
  opts = opts || {}
  opts.isGuard = opts.isGuard || false

  // evaluate expression to get the function parameters
  // via dependency injection
  with (scope) {
    var func = eval('('+expr+')')
  }

  var params = util.getFunctionParameters(func || function(cb) { cb(true) })
  var lastParamName = util.getLastParamName(params)

  if (opts.isGuard) {
    var parts = [
      'new Promise(function (s, j) {',
      indent(1) + 'var ' + lastParamName + ' = function(r) { r ? s() : j() }',
      indent(1) + 'with (self.Scope) { (' + expr + ').apply(self, [' + params + ']) }',
      '})'
    ]
  } else {
    var parts = [
      'new Promise(function (s) {',
      indent(1) + 'var ' + lastParamName + ' = s',
      indent(1) + 'with (self.Scope) { (' + expr + ').apply(self, [' + params + ']) }',
      '})'
    ]
  }

  return parts
}


