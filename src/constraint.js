module.exports = Constraint

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
}

Constraint.prototype.toString = function toString () {
  var res = this.name
  if (this.arity > 0) {
    res += '('
    res += this.args.map(escape).join(',')
    res += ')'
  }
  return res
}

function escape (val) {
  var res = JSON.stringify(val)
  if (typeof res !== 'string') {
    res = '"' + val.toString() + '"'
  }
  return res
}
