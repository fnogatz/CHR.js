module.exports = transform
module.exports.fromFile = transformFile

const fs = require('fs')

const parse = require('../parser.peg.js').parse
const util = require('./util')
const HeadCompiler = require('./head')
const transformOptimized = require('./optimized')

const indent = util.indent
const indentBy = util.indentBy

function transform (program, opts) {
  opts = opts || {}
  opts.exports = opts.exports || 'module.exports'
  opts.runtime = opts.runtime || 'require("chr/runtime")'

  if (opts.optimized) {
    return transformOptimized(program, opts)
  }

  const parsed = parse(program, {
    startRule: 'ProgramWithPreamble'
  })

  let parts = []

  parts.push(
    'var Runtime = ' + opts.runtime,
    ''
  )

  parts.push(opts.exports + ' = (function() {')
  const level = 1

  if (parsed.preamble) {
    parts.push(indent(level) + parsed.preamble)
    parts.push(indent(level))
  }

  const constraints = {}
  const constraintNames = {}
  const replacements = []

  const rules = parsed.body
  rules.forEach(function (ruleObj) {
    let head
    let functor
    let name
    let compiled

    // replace replacements
    ;['guard', 'body'].forEach(function (location) {
      ruleObj[location] = ruleObj[location].map(function (element) {
        if (element.type !== 'Replacement' ||
          typeof element.hasOwnProperty.original === 'undefined') {
          return element
        }

        let src = element.original
        if (location === 'guard') {
          src = 'return ' + src
        }

        const replacementId = replacements.push(src) - 1
        const newElement = {
          type: 'Replacement',
          num: replacementId
        }
        return newElement
      })
    })

    const headCompiler = new HeadCompiler(ruleObj, {
      replacements: replacements
    })

    for (let headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
      head = ruleObj.head[headNo]
      functor = head.functor

      if (!constraints[functor]) {
        constraints[functor] = []
      }
      name = functor.split('/')[0]
      constraintNames[name] = true

      compiled = headCompiler.headNo(headNo).map(function (row) {
        return '  ' + row
      })

      constraints[functor].push(compiled)
    }

    ruleObj.constraints.forEach(function (functor) {
      // add callers if not present
      const name = functor.split('/')[0]
      if (!constraintNames[name]) {
        constraintNames[name] = true
        constraints[functor] = []
      }
    })
  })

  parts.push(
    indent(level) + 'var _activators = {}',
    indent(level)
  )

  let activates
  for (const functor in constraints) {
    activates = []

    constraints[functor].forEach(function (occurrenceFunctionSource, occurrence) {
      const functionName = '_' + functor.replace('/', '_') + '_' + occurrence
      activates.push(functionName)

      parts.push(indent(level) + 'function ' + functionName + ' (constraint) {')
      parts = parts.concat(occurrenceFunctionSource.map(indentBy(level + 1)))
      parts.push(
        indent(level) + '}',
        indent(level)
      )
    })

    parts.push(indent(level) + '_activators.' + functor.replace('/', '_') + ' = function (constraint) {')
    parts.push(indent(level + 1) + 'return [')
    activates.forEach(function (activatorName, ix) {
      parts.push(indent(level + 1) + (ix > 0 ? ', ' : '  ') + activatorName)
    })
    parts.push(indent(level + 1) + '].reduce(function (curr, activator) {')
    parts.push(indent(level + 2) + 'return curr.then(function () {')
    parts.push(indent(level + 3) + 'return activator.call(chr, constraint)')
    parts.push(indent(level + 2) + '})')
    parts.push(indent(level + 1) + '}, Promise.resolve())')
    parts.push(
      indent(level) + '}',
      indent(level)
    )
  }

  parts = parts.concat(generateObject(opts, constraints, replacements).map(indentBy(level)))
  parts.push(indent(level))

  for (const constraintName in constraintNames) {
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
  const parts = []

  parts.push(
    indent(0) + 'var chr = {',
    indent(1) + 'Store: new Runtime.Store(),',
    indent(1) + 'History: new Runtime.History(),',
    indent(1) + 'Helper: Runtime.Helper,',
    indent(1) + 'Constraints: {'
  )

  let functorNo = 0
  for (const functor in constraints) {
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
  const parts = []

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
    indent(1) + 'var constraint = new Runtime.Constraint("' + name + '", arity, args)',
    indent(1) + 'self.Store.add(constraint)',
    indent(1) + 'return _activators[functor.replace("/","_")].call(chr, constraint)',
    indent(0) + '}'
  )

  return parts
}

function transformFile (filename, opts, callback) {
  fs.readFile(filename, 'utf8', function (err, code) {
    if (err) {
      return callback(err)
    }

    let result
    try {
      result = transform(code, opts)
    } catch (err) {
      return callback(err)
    }

    return callback(null, result)
  })
}
