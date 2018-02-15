// Constraint
function Constraint (name, arity, args) {
  this.name = name
  this.arity = arity
  this.functor = name + "/" + arity
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
  var s = this.name
  if (this.arity >= 1) {
    s += "(" + this.args.join(",") + ")"
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
  if (!this._index.hasOwnProperty(constraint.functor)) {
    this._index[constraint.functor] = []
  }
  constraint.id = this._nextId
  this._index[constraint.functor].push(constraint)
  this._size += 1
  this._nextId += 1
}

Store.prototype.remove = function (constraint) {
  constraint.alive = false
  var ix = this._index[constraint.functor].indexOf(constraint)
  this._index[constraint.functor].splice(ix, 1)

  this._size -= 1
}

Store.prototype.lookup = function (rule, patterns, constraint) {
  var ret = this.lookupResume(rule, patterns, constraint, 0)
  if (!ret || !ret.res) {
    return false
  }
  return ret.res
}

Store.prototype.lookupResume = function (rule, patterns, constraint, startFrom) {
  startFrom = startFrom || 0

  var lastPattern = patterns.length - 1
  var lengths = []
  var divs = []
  var div = 1
  var i

  // build array of arrays
  var arr = []
  for (i = 0; i <= lastPattern; i++) {
    if (patterns[i] === '_') {
      // "_" is a placeholder for the given `constraint`
      arr[i] = [ constraint ]
    } else if (this._index.hasOwnProperty(patterns[i])) {
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
  max = divs[0] * arr[0].length

  var res
  var res_ids
  loop_n: for (n = startFrom; n < max; n++) {
    res = []
    res_ids = []
    curr = n
    loop_i: for (i = 0; i <= lastPattern; i++) {
      res[i] = arr[i][curr / divs[i] >> 0]
      res_ids[i] = res[i].id

      //avoid multiple occurences of the same constraint
      if (res.slice(0, i).indexOf(res[i]) !== -1) {
        continue loop_n
      }

      curr = curr % divs[i]
    }
    
    // check if already in history
/*
    if (history.lookup(rule, res_ids)) {
      continue loop_n
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
    return "(empty)"
  }

  var maxLength_c = "constraint".length
  var maxLength_i = "id".length
  var rows = []
  for (var functor in this._index) {
    this._index[functor].forEach(function (c) {
      var s = c.toString()
      maxLength_c = Math.max(s.length, maxLength_c)
      maxLength_i = Math.max(c.id.toString().length+1, maxLength_i)
    })
  }
  for (var functor in this._index) {
    this._index[functor].forEach(function (c) {
      rows.push(c.id.toString().padStart(maxLength_i) + " | " + c.toString().padEnd(maxLength_c))
    })
  }

  return [
    "id".padStart(maxLength_i) + " | " + "constraint".padEnd(maxLength_c),
    "".padStart(maxLength_i, "-") + "-+-" + "".padEnd(maxLength_c, "-")
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
function trampoline () {
  var constraint
  while (constraint = stack.pop()) {
    constraint.continue()
  }
}

var chr = {
  Store: new Store()
}

var stack = []
// var history = new History()
