var required = {
  chr: require('./console/chr'),
  store: require('./console/store')
}

var config = {}
for (var key in required) {
  config[key.replace(/^array\./, 'array:')] = required[key]
}

if (process.env.NODE_ENV === 'browser') {
  module.exports = require('tconsole/string').bind(config)
} else {
  module.exports = require('tconsole')(config)
}
