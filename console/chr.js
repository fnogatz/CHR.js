var store = require('./store')

var config = {}
for (var key in store) {
  config[key] = store[key]
}

config.test = function () {
  return this.hasOwnProperty('Store') && this.hasOwnProperty('History')
}

config.insert = function (table, object, fields) {
  store.insert.call(this.Store, table, object, fields)
}

module.exports = config
