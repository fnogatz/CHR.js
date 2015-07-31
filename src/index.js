;(function () {
  var root = this
  var prevCHR
  if (root && root.CHR) {
    prevCHR = root.CHR
  }

  var Runtime = require('../runtime')
  var compileHead = require('./compile/head')

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

    /**
     * Adds a number of rules given.
     */
    function tag (chrSource) {
      var program

      if (typeof chrSource === 'object' && !(chrSource instanceof Array)) {
        // already parsed
        program = chrSource
      } else if (typeof chrSource === 'object' && chrSource instanceof Array) {
        // Called as template string
        var taggedChrSource = chrSource[0]

        var replacements = Array.prototype.slice.call(arguments, 1)
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

        program = parse(taggedChrSource)
      } else if (typeof chrSource === 'string') {
        program = parse(chrSource)
      } else {
        throw new Error("Can't handle input format " + (typeof chrSource))
      }

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
            tag[name] = Runtime.Helper.dynamicCaller(name).bind(tag)
            tag.Constraints[functor] = []
          }
        })

        // replace replacements if source and not number provided
        ;['guard', 'body'].forEach(function (location) {
          rule[location] = rule[location].map(function (element) {
            if (element.type !== 'Replacement' || !element.hasOwnProperty('original')) {
              return element
            }

            var src = element.original
            if (location === 'guard') {
              src = 'return ' + src
            }
            var pred = new Function(src) // eslint-disable-line

            var replacementId = tag.Replacements.push(pred) - 1
            var newElement = {
              type: 'Replacement',
              num: replacementId
            }
            return newElement
          })
        })

        for (var headNo = rule.head.length - 1; headNo >= 0; headNo--) {
          head = rule.head[headNo]
          functor = head.name + '/' + head.arity

          compiled = compileHead(rule, headNo)
          compiledFunction = new Function('constraint', compiled.join('\n')) // eslint-disable-line

          tag.Constraints[functor].push(compiledFunction)
        }
      })
    }

    tag.Store = opts.Store
    tag.History = opts.History
    tag.Constraints = {}
    tag.Replacements = []
    tag.Helper = Runtime.Helper

    return tag
  }

  CHR.Runtime = Runtime

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
}).call(this)
