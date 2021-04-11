var Runtime = require('../../runtime')

module.exports = (function() {
  var _activators = {}
  
  function _gcd_1_0 (constraint) {
      var self = this
      
      if (constraint.args[0] !== 0) {
        return Promise.resolve()
      }
      
      var constraintIds = [
        [ constraint.id ]
      ]
      
      return new Promise(function (resolve, reject) {
        self.Helper.forEach(constraintIds, function iterateConstraint (ids, callback) {
          if (!self.Store.allAlive(ids))
            return callback()
          
          if (self.History.has("undefined", ids))
            return callback()
          
          self.History.add("undefined", ids)
          self.Store.kill(ids[0])
          
          Promise.resolve()
          .then(function () {
            callback()
          })
          .catch(function() {
            reject()
          })
        }, resolve)
      })
  }
  
  function _gcd_1_1 (constraint) {
      var self = this
      
      var M = constraint.args[0]
      
      var constraintIds = [
        self.Store.lookup("gcd", 1)
      , [ constraint.id ]
      ]
      
      return new Promise(function (resolve, reject) {
        self.Helper.forEach(constraintIds, function iterateConstraint (ids, callback) {
          if (!self.Store.allAlive(ids))
            return callback()
          
          if (self.History.has("undefined", ids))
            return callback()
          
          var N = self.Store.args(ids[0])[0]
          
          var guards = [
            new Promise(function (s, j) { (0 < N) ? s() : j() })
          , new Promise(function (s, j) { (N <= M) ? s() : j() })
          ]
          
          Promise.all(guards)
          .then(function () {
            self.History.add("undefined", ids)
            self.Store.kill(ids[1])
            
            Promise.resolve()
            .then(function () {
              return self.gcd(M - N)
            })
            .then(function () {
              callback()
            })
            .catch(function() {
              reject()
            })
          })
          .catch(function () {
             callback()
          })
        }, resolve)
      })
  }
  
  function _gcd_1_2 (constraint) {
      var self = this
      
      var N = constraint.args[0]
      
      var constraintIds = [
        [ constraint.id ]
      , self.Store.lookup("gcd", 1)
      ]
      
      return new Promise(function (resolve, reject) {
        self.Helper.forEach(constraintIds, function iterateConstraint (ids, callback) {
          if (!self.Store.allAlive(ids))
            return callback()
          
          if (self.History.has("undefined", ids))
            return callback()
          
          var M = self.Store.args(ids[1])[0]
          
          var guards = [
            new Promise(function (s, j) { (0 < N) ? s() : j() })
          , new Promise(function (s, j) { (N <= M) ? s() : j() })
          ]
          
          Promise.all(guards)
          .then(function () {
            self.History.add("undefined", ids)
            self.Store.kill(ids[1])
            
            Promise.resolve()
            .then(function () {
              return self.gcd(M - N)
            })
            .then(function () {
              callback()
            })
            .catch(function() {
              reject()
            })
          })
          .catch(function () {
             callback()
          })
        }, resolve)
      })
  }
  
  _activators.gcd_1 = function (constraint) {
    return [
      _gcd_1_0
    , _gcd_1_1
    , _gcd_1_2
    ].reduce(function (curr, activator) {
      return curr.then(function () {
        return activator.call(chr, constraint)
      })
    }, Promise.resolve())
  }
  
  _activators.true_0 = function (constraint) {
    return [
    ].reduce(function (curr, activator) {
      return curr.then(function () {
        return activator.call(chr, constraint)
      })
    }, Promise.resolve())
  }
  
  var chr = {
    Store: new Runtime.Store(),
    History: new Runtime.History(),
    Helper: Runtime.Helper,
    Constraints: {
      "gcd/1": [
        _gcd_1_0.bind(chr)
      , _gcd_1_1.bind(chr)
      , _gcd_1_2.bind(chr)
      ]
    , "true/0": [
      ]
    },
    Replacements: [
    ]
  }
  
  chr.gcd = function() {
    var self = this
    
    var args = Array.prototype.slice.call(arguments)
    var arity = arguments.length
    var functor = "gcd/" + arity
    
    if (!self.Constraints[functor]) {
      throw new Error("Constraint "+functor+" not defined.")
    }
    
    var constraint = new Runtime.Constraint("gcd", arity, args)
    self.Store.add(constraint)
    return _activators[functor.replace("/","_")].call(chr, constraint)
  }
  
  chr.true = function() {
    var self = this
    
    var args = Array.prototype.slice.call(arguments)
    var arity = arguments.length
    var functor = "true/" + arity
    
    if (!self.Constraints[functor]) {
      throw new Error("Constraint "+functor+" not defined.")
    }
    
    var constraint = new Runtime.Constraint("true", arity, args)
    self.Store.add(constraint)
    return _activators[functor.replace("/","_")].call(chr, constraint)
  }
  
  return chr
})()
