const colors = require('colors') // eslint-disable-line no-unused-vars
const Store = require('../src/store')

module.exports = {
  fields: {
    Constraint: function () { return this.toString() },
    ID: function () { return this.id }
  },
  defaultFields: [
    'Constraint'
  ],
  headers: true,
  insert: function (table, object, fields) {
    if (this.invalid) {
      console.log('Constraint Store is invalid!'.red)
      console.log('This might be come by adding "false/0" or a contradiction'.grey)
      return false
    }

    const store = this._store
    for (const id in store) {
      const tableRow = fields.map(function cell (fieldName, rowNo) {
        return object.fields[fieldName].call(store[id], rowNo)
      })
      table.push(tableRow)
    }
    if (table.length === 0) {
      table.push(fields.map(function cell (fieldName) {
        if (fieldName === 'Constraint') {
          return '(empty)'
        }
        return ''
      }))
    }
  },
  test: function () {
    return this instanceof Store
  }
}
