module.exports = transform
module.exports.fromFile = transformFile

var fs = require('fs')

var parse = require('../parser').parse
var util = require('./util')
var compileHead = require('./head')

var indent = util.indent
var indentBy = util.indentBy

function transform (program, opts) {
  opts = opts || {}
  opts.exports = opts.exports || 'module.exports'
  opts.runtime = opts.runtime || 'require("chr/runtime")'

  var parsed = parse(program, {
    startRule: 'ProgramWithPreamble'
  })

  var parts = []

  parts.push(
    'var Runtime = ' + opts.runtime,
    ''
  )

  parts.push(opts.exports + ' = (function() {')
  var level = 1

  if (parsed.preamble) {
    parts.push(indent(level) + parsed.preamble)
    parts.push(indent(level))
  }

  var constraints = {}
  var constraintNames = {}
  var replacements = []

  var rules = parsed.body
  rules.forEach(function (rule) {
    var head
    var functor
    var compiled

    rule.constraints.forEach(function (functor) {
      var name = functor.split('/')[0]
      constraintNames[name] = true

      if (!constraints[functor]) {
        constraints[functor] = []
      }
    })

    // replace replacements
    ;['guard', 'body'].forEach(function (location) {
      rule[location] = rule[location].map(function (element) {
        if (element.type !== 'Replacement' || !element.hasOwnProperty('original')) {
          return element
        }

        var src = element.original
        if (location === 'guard') {
          src = 'return ' + src
        }

        var replacementId = replacements.push(src) - 1
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

      compiled = compileHead(rule, headNo, {
        helper: 'Runtime.Helper'
      })
      constraints[functor].push(compiled)
    }
  })

  parts.push(
    indent(level) + 'var _activators = {}',
    indent(level)
  )

  var activates
  for (var functor in constraints) {
    activates = []

    constraints[functor].forEach(function (occurrenceFunctionSource, occurrence) {
      var functionName = '_' + functor.replace('/', '_') + '_' + occurrence
      activates.push(functionName)

      parts.push(indent(level) + 'function ' + functionName + ' (constraint) {')
      parts = parts.concat(occurrenceFunctionSource.map(indentBy(level + 1)))
      parts.push(
        indent(level) + '}',
        indent(level)
      )
    })

    parts.push(indent(level) + '_activators.' + functor.replace('/', '_') + ' = function (constraint) {')
    activates.map(function (activatorName) {
      parts.push(indent(level + 1) + activatorName + '.call(chr, constraint)')
    })
    parts.push(
      indent(level) + '}',
      indent(level)
    )
  }

  parts = parts.concat(generateObject(opts, constraints, replacements).map(indentBy(level)))
  parts.push(indent(level))

  for (var constraintName in constraintNames) {
    parts = parts.concat(generateCaller(opts, constraintName).map(indentBy(level)))
    parts.push(indent(level))
  }

  parts.push(
    indent(level) + 'return chr',
    '})()'
  )

  return parts.join('\n')
}

function generateObject (opts, constraints, replacements) {
  var parts = []

  parts.push(
    indent(0) + 'var chr = {',
    indent(1) + 'Store: new Runtime.Store(),',
    indent(1) + 'History: new Runtime.History(),',
    indent(1) + 'Constraints: {'
  )

  var functorNo = 0
  for (var functor in constraints) {
    parts.push((functorNo++ > 0 ? indent(1) + ', ' : indent(2)) + '"' + functor + '": [')
    constraints[functor].forEach(function (o, occurrence) {
      parts.push((occurrence > 0 ? indent(2) + ', ' : indent(3)) + '_' + functor.replace('/', '_') + '_' + occurrence + '.bind(chr)')
    })
    parts.push(indent(2) + ']')
  }

  parts.push(
    indent(1) + '},',
    indent(1) + 'Replacements: ['
  )

  replacements.forEach(function (replacement, ix) {
    parts.push(
      (ix > 0 ? ', ' + indent(1) : indent(2)) + 'function () {',
      indent(3) + replacement,
      indent(2) + '}'
    )
  })

  parts.push(
    indent(1) + ']',
    indent(0) + '}'
  )

  return parts
}

function generateCaller (opts, name) {
  var parts = []

  parts.push(
    indent(0) + 'chr.' + name + ' = function() {',
    indent(1) + 'var self = this',
    indent(1),
    indent(1) + 'var args = Array.prototype.slice.call(arguments)',
    indent(1) + 'var arity = arguments.length',
    indent(1) + 'var functor = "' + name + '/" + arity',
    indent(1),
    indent(1) + 'if (!self.Constraints[functor]) {',
    indent(2) + 'throw new Error("Constraint "+functor+" not defined.")',
    indent(1) + '}',
    indent(1),
    indent(1) + 'var constraint = new Runtime.Constraint("' + name + ' ", arity, args)',
    indent(1) + 'self.Store.add(constraint)',
    indent(1) + '_activators[functor.replace("/","_")].call(chr, constraint)',
    indent(0) + '}'
  )

  return parts
}

function transformFile (filename, opts, callback) {
  fs.readFile(filename, 'utf8', function (err, code) {
    if (err) {
      return callback(err)
    }

    var result
    try {
      result = transform(code, opts)
    } catch (err) {
      return callback(err)
    }

    return callback(null, result)
  })
}
