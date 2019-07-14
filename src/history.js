module.exports = History

function History () {
  this._history = {}
}

History.prototype.add = function add (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    this._history[rule] = []
  }

  var str = hash(ids)
  this._history[rule].push(str)
}

History.prototype.notIn = function notIn (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    return true
  }

  var str = hash(ids)
  var found = (this._history[rule].indexOf(str) >= 0)
  return !found
}

History.prototype.has = function has (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    return false
  }

  var str = hash(ids)
  var found = (this._history[rule].indexOf(str) >= 0)
  return found
}

function hash (ids) {
  return ids.join('_')
}
