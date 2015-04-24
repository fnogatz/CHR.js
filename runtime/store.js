module.exports = Store

function Store () {
  this.reset()
}

Store.prototype.reset = function reset () {
  this._lastId = 0
  this._store = {}
  this._index = {}

  this.invalid = false
}

/**
 * Add a new Constraint in the Constraint Store.
 * @param  {Constraint} constraint
 * @return {Id}         ID of the stored Constraint
 */
Store.prototype.add = function add (constraint) {
  var id = this._getNewConstraintId()
  constraint.id = id
  this._store[id] = constraint
  this._addToIndex(constraint)

  return id
}

Store.prototype.kill = function kill (id) {
  var constraint = this._store[id]
  constraint.alive = false
  delete this._store[id]
  delete this._index[constraint.name][constraint.arity][constraint.id]
}

Store.prototype._getNewConstraintId = function _getNewConstraintId () {
  this._lastId += 1
  return this._lastId
}

Store.prototype._addToIndex = function _addToIndex (constraint) {
  var index = this._index
  if (!index.hasOwnProperty(constraint.name)) {
    index[constraint.name] = {}
  }
  if (!index[constraint.name].hasOwnProperty(constraint.arity)) {
    index[constraint.name][constraint.arity] = {}
  }

  index[constraint.name][constraint.arity][constraint.id] = true
}

Store.prototype.alive = function alive (id) {
  if (!this._store[id]) {
    return false
  }

  return this._store[id].alive
}

Store.prototype.args = function args (id) {
  return this._store[id].args
}

Store.prototype.lookup = function lookup (name, arity) {
  var index = this._index

  if (index.hasOwnProperty(name) && index[name].hasOwnProperty(arity)) {
    return Object.keys(index[name][arity])
  }

  return []
}

Store.prototype.invalidate = function invalidate () {
  this.reset()
  this.invalid = true
}
