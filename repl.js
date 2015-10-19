module.exports = Repl

var repl = require('repl')
var spinner = require('char-spinner')
var CHR = require('./src/index')
var parse = require('./src/repl.peg.js').parse

function Repl () {
  var chr = new CHR()

  var r = repl.start({
    prompt: 'CHR > ',
    input: process.stdin,
    output: process.stdout,
    eval: function (cmd, context, filename, callback) {
      // try Program
      try {
        var rules = parse(cmd.trim(), { startRule: 'Program' })
      } catch (e) {
        // try Query
        try {
          var queries = parse(cmd.trim(), { startRule: 'Query' })
        } catch (e) {
          // no query
          var res = eval(cmd) // eslint-disable-line
          callback(null, res)

          return
        }

        // run query
        var spin = spinner({
          stream: r.outputStream
        })

        var queryPromise = queries.reduce(function (promise, query) {
          return promise.then(function () {
            var chrCmd = 'chr.' + query.original
            if (query.original.slice(-1)[0] !== ')') {
              chrCmd += '()'
            }
            var queryPromise = eval(chrCmd) // eslint-disable-line
            return queryPromise
          })
        }, Promise.resolve())

        queryPromise.then(function () {
          clearInterval(spin)
          r.output.write(chr.Store.toString().split('\n').map(function (row) {
            return '  ' + row
          }).join('\n'))
          callback()
        }).catch(function (e) {
          clearInterval(spin)
          r.output.write('  [Error] ' + errorMsg(e) + '\n')
          r.output.write(chr.Store.toString())
          callback()
        })

        return
      }

      // add rules
      chr(rules)
      r.output.write('  [Rule' + (rules.body.length > 1 ? 's' : '') + '] Added.\n')

      callback()
      return
    }
  })
}

function errorMsg (e) {
  e = e.toString()

  if (e.match(/^TypeError: chr\..* is not a function$/)) {
    var constraint = e.replace(/^TypeError: chr\.(.*) is not a function$/, '$1')
    return 'Undefined constraint: ' + constraint
  }

  return e
}

if (require.main === module) {
  Repl()
}
