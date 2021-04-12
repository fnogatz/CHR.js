module.exports = {}
module.exports.indent = indent
module.exports.indentBy = indentBy
module.exports.destructuring = destructuring
module.exports.getFunctionParameters = getFunctionParameters
module.exports.getLastParamName = getLastParamName
module.exports.replaceLastParam = replaceLastParam
module.exports.isArrowFunction = isArrowFunction
module.exports.escape = escape

function indent (level, text, spaces) {
  level = level || 0
  if (typeof text === 'number') {
    spaces = text
    text = null
  }
  spaces = spaces || 2
  text = text || null

  if (text && typeof text === 'string') {
    return text.split('\n').map(function (row) {
      return indent(level, spaces) + row
    }).join('\n')
  } else if (text && text instanceof Array) {
    return text.map(indentBy(level, spaces))
  }

  return Array((level * spaces) + 1).join(' ')
}

function indentBy (level, spaces) {
  return function (str) {
    return indent(level, spaces) + str
  }
}

function destructuring (constraint, to, thenStmt) {
  thenStmt = thenStmt || 'return Promise.resolve()'

  let parts = []
  constraint.parameters.forEach(function (parameter, i) {
    if (parameter.type === 'Literal') {
      parts.push(indent(0) + 'if (' + to + '[' + i + '] !== ' + escape(parameter.value) + ') {')
      if (Array.isArray(thenStmt)) {
        parts = parts.concat(thenStmt.map(indentBy(1)))
      } else {
        parts.push(indent(1) + thenStmt)
      }
      parts.push(indent(0) + '}')
      return
    }

    let name = parameter.name
    if (parameter.type === 'ArrayExpression') {
      parts.push('', '// Note: This feature needs native Destructuring (Array value).')

      name = parameter.original
    } else if (parameter.type === 'ObjectExpression') {
      parts.push('', '// Note: This feature needs native Destructuring (Object value).')

      name = parameter.original
    }

    parts.push('var ' + name + ' = ' + to + '[' + i + ']')
  })
  return parts
}

function getFunctionParameters (func) {
  if (isArrowFunction(func)) {
    return func.toString().match(/^\(\s*([^)]*)\)\s*=>/m)[1]
  } else {
    return func.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m)[1]
  }
}

function getLastParamName (params) {
  return params.replace(/(^.*,|^)\s*([^,]+)$/g, '$2')
}

function replaceLastParam (params, replacement) {
  return params.replace(/((^.*,|^)\s*)([^,]+)$/g, '$1' + replacement)
}

function isArrowFunction (func) {
  return !Object.prototype.hasOwnProperty.call(func, 'prototype')
}

function escape (val) {
  if (typeof val === 'string') {
    return '"' + val + '"'
  }
  if (val === null) {
    return 'null'
  }

  return val
}
