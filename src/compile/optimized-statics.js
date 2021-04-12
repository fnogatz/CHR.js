/* eslint no-labels: ["error", { "allowLoop": true }] */

// Constraint
function Constraint (name, arity, args) {
  this.name = name
  this.arity = arity
  this.functor = name + '/' + arity
  this.args = args
  this.id = null
  this.alive = true
  this.activated = false
  this.stored = false
  this.hist = null
  this.cont = null
}

Constraint.prototype.continue = function () {
  this.cont[0].call(this, this, this.cont[1])
}

Constraint.prototype.toString = function () {
  let s = this.name
  if (this.arity >= 1) {
    s += '(' + this.args.join(',') + ')'
  }
  return s
}

// Store
function Store () {
  this._index = {}
  this._size = 0
  this._nextId = 0
}

Store.prototype.add = function (constraint) {
  if (typeof this._index[constraint.functor] === 'undefined') {
    this._index[constraint.functor] = []
  }
  constraint.id = this._nextId
  this._index[constraint.functor].push(constraint)
  this._size += 1
  this._nextId += 1
}

Store.prototype.remove = function (constraint) {
  constraint.alive = false
  const ix = this._index[constraint.functor].indexOf(constraint)
  this._index[constraint.functor].splice(ix, 1)

  this._size -= 1
}

Store.prototype.lookup = function (rule, patterns, constraint) {
  const ret = this.lookupResume(rule, patterns, constraint, 0)
  if (!ret || !ret.res) {
    return false
  }
  return ret.res
}

Store.prototype.lookupResume = function (rule, patterns, constraint, startFrom) {
  startFrom = startFrom || 0

  const lastPattern = patterns.length - 1
  const lengths = []
  const divs = []
  let div = 1
  let i

  // build array of arrays
  const arr = []
  for (i = 0; i <= lastPattern; i++) {
    if (patterns[i] === '_') {
      // "_" is a placeholder for the given `constraint`
      arr[i] = [constraint]
    } else if (typeof this._index[patterns[i]] !== 'undefined') {
      arr[i] = this._index[patterns[i]]
    } else {
      // not a single element for this functor
      return false
    }
  }

  for (i = lastPattern; i >= 0; i--) {
    lengths[i] = arr[i].length
    divs[i] = div
    div *= arr[i].length
  }
  const max = divs[0] * arr[0].length

  let res
  let resIds
  let curr
  loopng: for (let n = startFrom; n < max; n++) {
    res = []
    resIds = []
    curr = n
    for (i = 0; i <= lastPattern; i++) {
      res[i] = arr[i][curr / divs[i] >> 0]
      resIds[i] = res[i].id

      // avoid multiple occurences of the same constraint
      if (res.slice(0, i).indexOf(res[i]) !== -1) {
        continue loopng
      }

      curr = curr % divs[i]
    }

    // check if already in history
    /*
    if (history.lookup(rule, resIds)) {
      continue loopng
    }
*/
    return {
      n: n,
      res: res
    }
  }

  return false
}

Store.prototype.size = function () {
  return this._size
}

Store.prototype.valueOf = function () {
  return this.size()
}

Store.prototype.toString = function () {
  if (this.size() === 0) {
    return '(empty)'
  }

  let maxLengthC = 'constraint'.length
  let maxLengthI = 'id'.length
  const rows = []
  let functor
  for (functor in this._index) {
    this._index[functor].forEach(function (c) {
      const s = c.toString()
      maxLengthC = Math.max(s.length, maxLengthC)
      maxLengthI = Math.max(c.id.toString().length + 1, maxLengthI)
    })
  }
  for (functor in this._index) {
    this._index[functor].forEach(function (c) {
      rows.push(c.id.toString().padStart(maxLengthI) + ' | ' + c.toString().padEnd(maxLengthC))
    })
  }

  return [
    'id'.padStart(maxLengthI) + ' | ' + 'constraint'.padEnd(maxLengthC),
    ''.padStart(maxLengthI, '-') + '-+-' + ''.padEnd(maxLengthC, '-')
  ].concat(rows).join('\n')
}

// History
/*
function History () {
  this._index = {}
  this._size = 0
}

History.prototype.size = function () {
  return this._size
}

History.prototype.valueOf = function () {
  return this.size()
}

History.prototype.toString = function () {
  if (this.size() === 0) {
    return "(empty)"
  }

  var maxLength_r = "rule".length
  var maxLength_f = "fired with".length
  var rows = []
  var curr
  for (var rule in this._index) {
    maxLength_r = Math.max(rule.toString().length, maxLength_r)
  }

  // TODO
}

History.prototype.add = function (rule, ids) {
  if (!this._index.hasOwnProperty(rule)) {
    this._index[rule] = {}
  }

  var curr = this._index[rule]
  for (var i = 0; i < ids.length-1; i++) {
    if (!curr.hasOwnProperty(ids[i])) {
      curr[ids[i]] = {}
    }
    curr = curr[ids[i]]
  }
  curr[ids[i]] = true

  this._size += 1
}

History.prototype.lookup = function (rule, ids) {
  if (!this._index.hasOwnProperty(rule)) {
    return false
  }

  var curr = this._index[rule]
  for (var i = 0; i < ids.length; i++) {
    if (!curr[ids[i]]) {
      return false
    }
    curr = curr[ids[i]]
  }

  if (curr !== true) {
    return false
  }

  return true
}
*/
// trampoline
function trampoline () { // eslint-disable-line
  let constraint
  while (constraint = stack.pop()) { // eslint-disable-line
    constraint.continue()
  }
}

var chr = { // eslint-disable-line
  Store: new Store()
}

var stack = [] // eslint-disable-line
// var history = new History()
