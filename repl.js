module.exports = Repl

const repl = require('repl')
const spinner = require('char-spinner')
const CHR = require('./src/index')
const parse = require('./src/repl.peg.js').parse

function Repl () {
  const chr = new CHR()

  const r = repl.start({
    prompt: 'CHR > ',
    input: process.stdin,
    output: process.stdout,
    eval: function (cmd, context, filename, callback) {
      cmd = cmd.trim()
      let re
      let ruleName

      // is it a special command?
      if (cmd === '/exit') {
        process.exit(0)
      }
      if (cmd === '/rules') {
        chr.Rules.ForEach(function (rule) {
          r.output.write(require('util').inspect(rule._source, false, null))
        })

        return callback()
      }
      re = /^\/rule (.*)$/
      if (re.test(cmd)) {
        // e.g. `/rule rule-name`
        ruleName = cmd.replace(re, '$1')
        if (!chr.Rules[ruleName]) {
          r.output.write('No rule with name ' + ruleName)
          return callback()
        }

        r.output.write(require('util').inspect(chr.Rules[ruleName], false, null))
        return callback()
      }
      re = /^\/rule-functor ([^ ]*) (.*)$/
      if (re.test(cmd)) {
        // e.g. `/rule-functor rule-name functor-name`
        ruleName = cmd.replace(re, '$1')
        let functor = cmd.replace(re, '$2')

        if (!chr.Rules[ruleName]) {
          r.output.write('No rule with name ' + ruleName)
          return callback()
        }

        let occurrence = null
        re = /^(.*)\[([0-9]+)\]$/
        if (re.test(cmd)) {
          // has occurrence number
          occurrence = functor.replace(re, '$2')
          functor = functor.replace(re, '$1')
        }

        if (!chr.Rules[ruleName][functor]) {
          r.output.write('Rule ' + ruleName + ' has no functor ' + functor)
          return callback()
        }

        if (occurrence !== null) {
          if (!chr.Rules[ruleName][functor][occurrence]) {
            r.output.write('Rule ' + ruleName + ' has no occurrence ' + occurrence + ' of functor ' + functor)
            return callback()
          }

          r.output.write(chr.Rules[ruleName][functor][occurrence].toString())
          return callback()
        }

        r.output.write(require('util').inspect(chr.Rules[ruleName][functor], false, null))
        return callback()
      }

      // try Program
      let rules, queries
      try {
        rules = parse(cmd, { startRule: 'Program' })
      } catch (e) {
        // try Query
        try {
          queries = parse(cmd, { startRule: 'Query' })
        } catch (e) {
          // no query
          var res = eval(cmd) // eslint-disable-line
          callback(null, res)

          return
        }

        // run query
        const spin = spinner({
          stream: r.outputStream
        })

        const queryPromise = queries.reduce(function (promise, query) {
          return promise.then(function () {
            let chrCmd = 'chr.' + query.original
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
    }
  })
}

function errorMsg (e) {
  e = e.toString()

  if (e.match(/^TypeError: chr\..* is not a function$/)) {
    const constraint = e.replace(/^TypeError: chr\.(.*) is not a function$/, '$1')
    return 'Undefined constraint: ' + constraint
  }

  return e
}

if (require.main === module) {
  Repl()
}
