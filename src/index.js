;(function () {
  var root = this
  var prevCHR
  if (root && root.CHR) {
    prevCHR = root.CHR
  }

  var Runtime = require('../runtime')
  var Rules = require('./rules')
  var Rule = require('./rule')
  var joinParts = require('./join-parts')

  var parse
  if (process.env.NODE_ENV === 'browserWithoutParser') {
    parse = root.parseCHR
  } else {
    parse = require('./parser.peg.js').parse
  }

  function CHR (opts) {
    opts = opts || {}
    opts.store = opts.store || new Runtime.Store()
    opts.history = opts.history || new Runtime.History()
    opts.rules = opts.rules || new Rules(tag)
    opts.scope = opts.scope || {}

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
        replacements = []

        // allow to specify replacements as second argument
        if (arguments[1] && typeof arguments[1] === 'object' && arguments[1] instanceof Array) {
          replacements = arguments[1]
        }
      } else if (typeof chrSource === 'object' && chrSource instanceof Array && typeof chrSource[0] === 'string') {
        // called as template tag
        // e.g. tag`a ==> b`
        // or   tag`a ==> ${ function() { console.log('Replacement test') } }`
        var combined = [
          chrSource[0]
        ]
        Array.prototype.slice.call(arguments, 1).forEach(function (repl, ix) {
          combined.push(repl)
          combined.push(chrSource[ix + 1])
        })
        chrSource = joinParts(combined)
        replacements = Array.prototype.slice.call(arguments, 1)
        program = parse(chrSource)
      } else if (typeof chrSource === 'string' && arguments[1] && arguments[1] instanceof Array) {
        // called with program and replacements array
        // e.g. tag(
        //        'a ==> ${ function() { console.log("Replacement test") } }',
        //        [ eval('( function() { console.log("Replacement test") } )') ]
        //      )
        // this is useful to ensure the scope of the given replacements
        program = parse(chrSource)
        replacements = arguments[1]
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

    tag.Store = opts.store
    tag.History = opts.history
    tag.Rules = opts.rules
    tag.Scope = opts.scope

    // this will save all constraint functors with
    //   an array of the rules they occur in
    tag.Constraints = {}

    Object.defineProperty(tag, 'Functors', {
      get: function () {
        return Object.keys(tag.Constraints)
      }
    })

    tag.Helper = Runtime.Helper

    return tag
  }

  // expose public constructors
  CHR.Constraint = Runtime.Constraint
  CHR.Store = Runtime.Store
  CHR.History = Runtime.History
  CHR.Rule = Rule

  CHR.version = '__VERSION__'

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
