;(function () {
  var root = this
  var prevCHR
  if (root && root.CHR) {
    prevCHR = root.CHR
  }

  var Runtime = require('../runtime')
  var Rules = require('./rules')
  var joinParts = require('./join-parts')

  var parse
  if (process.env.NODE_ENV === 'browserWithoutParser') {
    parse = root.parseCHR
  } else {
    parse = require('./parser').parse
  }

  function CHR (opts) {
    opts = opts || {}
    opts.Store = opts.Store || new Runtime.Store()
    opts.History = opts.History || new Runtime.History()
    opts.Rules = opts.Rules || new Rules(tag)

    /**
     * Adds a number of rules given.
     */
    function tag (chrSource) {
      var program
      var replacements

      // Examine caller format
      if (typeof chrSource === 'object' && chrSource.type && chrSource.type === 'Program') {
        // called with already parsed source code
        // e.g. tag({ type: 'Program', body: [ ... ] })
        program = chrSource
        replacements = chrSource.replacements || []
      } else if (typeof chrSource === 'object' && chrSource instanceof Array && typeof chrSource[0] === 'string') {
        // called as template tag
        // e.g. tag`a ==> b`
        // or   tag`a ==> ${ function() { console.log('Replacement test') } }`
        var combined = [ chrSource[0] ]
        Array.prototype.slice.call(arguments, 1).forEach(function (repl, ix) {
          combined.push(repl)
          combined.push(chrSource[ix + 1])
        })
        chrSource = joinParts(combined)
        replacements = Array.prototype.slice.call(arguments, 1)
        program = parse(chrSource)
      } else if (typeof chrSource === 'string') {
        // called as normal function
        // e.g. tag('a ==> b')
        // or   tag('a ==> ', function() { console.log('Replacement test') })
        replacements = Array.prototype.filter.call(arguments, isFunction)
        chrSource = joinParts(Array.prototype.slice.call(arguments))
        program = parse(chrSource)
      }

      var rules = program.body
      rules.forEach(function (rule) {
        tag.Rules.Add(rule, replacements)
      })
    }

    tag.Store = opts.Store
    tag.History = opts.History
    tag.Rules = opts.Rules

    // this will save all constraint functors with
    //   an array of the rules they occur in
    tag.Constraints = {}

    tag.Helper = Runtime.Helper

    return tag
  }

  CHR.noConflict = function () {
    root.CHR = prevCHR
    return CHR
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = CHR
    } else {
      exports.CHR = CHR
    }
  } else {
    root.CHR = CHR
  }

  function isFunction (el) {
    return typeof el === 'function'
  }
}).call(this)
