module.exports = CHR
module.exports.generateCaller = generateCaller

var Store = require('./store')
var History = require('./history')
var Constraint = require('./constraint')
var parse = require('./parser').parse
var compile = require('./compile')

function CHR (opts) {
  opts = opts || {}
  opts.Store = opts.Store || new Store()
  opts.History = opts.History || new History()

  /**
   * Adds a number of rules given as argument string.
   */
  function tag (chrSource) {
    var replacements = []

    if (typeof chrSource === 'object' && chrSource instanceof Array) {
      // Called as template string
      var taggedChrSource = chrSource[0]

      replacements = Array.prototype.slice.call(arguments, 1)
      replacements.forEach(function (expr, ix) {
        var pred
        if (typeof expr !== 'function') {
          console.warn('Expressions should be functions, #' + (ix + 1) + ' is not. Therefore it is evaluated only once on compilation time, but not for each rule application.')
          pred = function () {
            return expr
          }
        } else {
          pred = expr
        }

        var replacementId = tag.Replacements.push(pred) - 1
        taggedChrSource += '${' + replacementId + '}' + chrSource[ix + 1]
      })

      chrSource = taggedChrSource
    }

    var program = parse(chrSource)
    var rules = program.body

    rules.forEach(function (rule) {
      var head
      var functor
      var compiled
      var compiledFunction

      rule.constraints.forEach(function (functor) {
        var name = functor.split('/')[0]

        // Add caller if not present
        if (!tag[name]) {
          tag[name] = generateCaller(name).bind(tag)
          tag.Constraints[functor] = []
        }
      })

      for (var headNo = rule.head.length - 1; headNo >= 0; headNo--) {
        head = rule.head[headNo]
        functor = head.name + '/' + head.arity

        compiled = compile.head(rule, headNo)
        compiledFunction = new Function('constraint', compiled.join('\n')) // eslint-disable-line

        tag.Constraints[functor].push(compiledFunction)
      }
    })
  }

  tag.AllDifferent = allDifferent

  /**
   * Constraint store for this handler.
   * @type {Runtime.Store}
   */
  tag.Store = opts.Store
  tag.History = opts.History
  tag.Constraints = {}
  tag.Replacements = []

  return tag
}

function generateCaller (name) {
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

function allDifferent (arr) {
  return arr.every(function (el1, ix) {
    return arr.slice(ix + 1).every(function (el2) {
      return el1 != el2 // eslint-disable-line eqeqeq
    })
  })
}
