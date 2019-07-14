var store = require('./store')

var config = {}
for (var key in store) {
  config[key] = store[key]
}

config.test = function () {
  return (typeof this.Store !== 'undefined' &&
    typeof this.History !== 'undefined')
}

config.insert = function (table, object, fields) {
  store.insert.call(this.Store, table, object, fields)
}

module.exports = config
