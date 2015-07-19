var Runtime = require('../runtime')
var compile = require('./compile')

module.exports = {
  Runtime: Runtime,
  compile: inBrowserCompile
}

function inBrowserCompile (code, opts) {
  opts = opts || {}
  opts.globalName = opts.globalName || 'chrjs'
  opts.withoutHeader = (opts.hasOwnProperty('withoutHeader') ? opts.withoutHeader : true)
  opts.exports = (opts.hasOwnProperty('exports') ? opts.exports : 'window.CHR')
  opts.runtime = (opts.hasOwnProperty('runtime') ? opts.runtime : opts.globalName + '.Runtime')

  return compile(code, opts)
}
