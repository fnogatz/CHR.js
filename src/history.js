module.exports = History

function History () {
  this._history = {}
}

History.prototype.add = function add (rule, ids) {
  if (!this._history.hasOwnProperty(rule)) {
    this._history[rule] = []
  }

  var str = hash(ids)
  this._history[rule].push(str)
}

History.prototype.notIn = function notIn (rule, ids) {
  if (!this._history.hasOwnProperty(rule)) {
    return true
  }

  var str = hash(ids)
  var found = (this._history[rule].indexOf(str) >= 0)
  return !found
}

History.prototype.has = function has (rule, ids) {
  if (!this._history.hasOwnProperty(rule)) {
    return false
  }

  var str = hash(ids)
  var found = (this._history[rule].indexOf(str) >= 0)
  return found
}

function hash (ids) {
  return ids.join('_')
}
