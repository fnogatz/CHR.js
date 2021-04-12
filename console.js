const required = {
  chr: require('./console/chr'),
  store: require('./console/store')
}

const config = {}
for (const key in required) {
  config[key.replace(/^array\./, 'array:')] = required[key]
}

if (process.env.NODE_ENV === 'browser') {
  module.exports = require('tconsole/string').bind(config)
} else {
  module.exports = require('tconsole')(config)
}
