(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CHR = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
module.exports = Table

function Table() {
  this.rows = []
  this.row = {__printers : {}}
}

/**
 * Push the current row to the table and start a new one
 *
 * @returns {Table} `this`
 */

Table.prototype.newRow = function() {
  this.rows.push(this.row)
  this.row = {__printers : {}}
  return this
}

/**
 * Write cell in the current row
 *
 * @param {String} col          - Column name
 * @param {Any} val             - Cell value
 * @param {Function} [printer]  - Printer function to format the value
 * @returns {Table} `this`
 */

Table.prototype.cell = function(col, val, printer) {
  this.row[col] = val
  this.row.__printers[col] = printer || string
  return this
}

/**
 * String to separate columns
 */

Table.prototype.separator = '  '

function string(val) {
  return val === undefined ? '' : ''+val
}

function length(str) {
  return str.replace(/\u001b\[\d+m/g, '').length
}

/**
 * Default printer
 */

Table.string = string

/**
 * Create a printer which right aligns the content by padding with `ch` on the left
 *
 * @param {String} ch
 * @returns {Function}
 */

Table.leftPadder = leftPadder

function leftPadder(ch) {
  return function(val, width) {
    var str = string(val)
    var len = length(str)
    var pad = width > len ? Array(width - len + 1).join(ch) : ''
    return pad + str
  }
}

/**
 * Printer which right aligns the content
 */

var padLeft = Table.padLeft = leftPadder(' ')

/**
 * Create a printer which pads with `ch` on the right
 *
 * @param {String} ch
 * @returns {Function}
 */

Table.rightPadder = rightPadder

function rightPadder(ch) {
  return function padRight(val, width) {
    var str = string(val)
    var len = length(str)
    var pad = width > len ? Array(width - len + 1).join(ch) : ''
    return str + pad
  }
}

var padRight = rightPadder(' ')

/**
 * Create a printer for numbers
 *
 * Will do right alignment and optionally fix the number of digits after decimal point
 *
 * @param {Number} [digits] - Number of digits for fixpoint notation
 * @returns {Function}
 */

Table.number = function(digits) {
  return function(val, width) {
    if (val == null) return ''
    if (typeof val != 'number')
      throw new Error(''+val + ' is not a number')
    var str = digits == null ? val+'' : val.toFixed(digits)
    return padLeft(str, width)
  }
}

function each(row, fn) {
  for(var key in row) {
    if (key == '__printers') continue
    fn(key, row[key])
  }
}

/**
 * Get list of columns in printing order
 *
 * @returns {string[]}
 */

Table.prototype.columns = function() {
  var cols = {}
  for(var i = 0; i < 2; i++) { // do 2 times
    this.rows.forEach(function(row) {
      var idx = 0
      each(row, function(key) {
        idx = Math.max(idx, cols[key] || 0)
        cols[key] = idx
        idx++
      })
    })
  }
  return Object.keys(cols).sort(function(a, b) {
    return cols[a] - cols[b]
  })
}

/**
 * Format just rows, i.e. print the table without headers and totals
 *
 * @returns {String} String representaion of the table
 */

Table.prototype.print = function() {
  var cols = this.columns()
  var separator = this.separator
  var widths = {}
  var out = ''

  // Calc widths
  this.rows.forEach(function(row) {
    each(row, function(key, val) {
      var str = row.__printers[key].call(row, val)
      widths[key] = Math.max(length(str), widths[key] || 0)
    })
  })

  // Now print
  this.rows.forEach(function(row) {
    var line = ''
    cols.forEach(function(key) {
      var width = widths[key]
      var str = row.hasOwnProperty(key)
        ? ''+row.__printers[key].call(row, row[key], width)
        : ''
      line += padRight(str, width) + separator
    })
    line = line.slice(0, -separator.length)
    out += line + '\n'
  })

  return out
}

/**
 * Format the table
 *
 * @returns {String}
 */

Table.prototype.toString = function() {
  var cols = this.columns()
  var out = new Table()

  // copy options
  out.separator = this.separator

  // Write header
  cols.forEach(function(col) {
    out.cell(col, col)
  })
  out.newRow()
  out.pushDelimeter(cols)

  // Write body
  out.rows = out.rows.concat(this.rows)

  // Totals
  if (this.totals && this.rows.length) {
    out.pushDelimeter(cols)
    this.forEachTotal(out.cell.bind(out))
    out.newRow()
  }

  return out.print()
}

/**
 * Push delimeter row to the table (with each cell filled with dashs during printing)
 *
 * @param {String[]} [cols]
 * @returns {Table} `this`
 */

Table.prototype.pushDelimeter = function(cols) {
  cols = cols || this.columns()
  cols.forEach(function(col) {
    this.cell(col, undefined, leftPadder('-'))
  }, this)
  return this.newRow()
}

/**
 * Compute all totals and yield the results to `cb`
 *
 * @param {Function} cb - Callback function with signature `(column, value, printer)`
 */

Table.prototype.forEachTotal = function(cb) {
  for(var key in this.totals) {
    var aggr = this.totals[key]
    var acc = aggr.init
    var len = this.rows.length
    this.rows.forEach(function(row, idx) {
      acc = aggr.reduce.call(row, acc, row[key], idx, len)
    })
    cb(key, acc, aggr.printer)
  }
}

/**
 * Format the table so that each row represents column and each column represents row
 *
 * @param {Object} [opts]
 * @param {String} [ops.separator] - Column separation string
 * @param {Function} [opts.namePrinter] - Printer to format column names
 * @returns {String}
 */

Table.prototype.printTransposed = function(opts) {
  opts = opts || {}
  var out = new Table
  out.separator = opts.separator || this.separator
  this.columns().forEach(function(col) {
    out.cell(0, col, opts.namePrinter)
    this.rows.forEach(function(row, idx) {
      out.cell(idx+1, row[col], row.__printers[col])
    })
    out.newRow()
  }, this)
  return out.print()
}

/**
 * Sort the table
 *
 * @param {Function|string[]} [cmp] - Either compare function or a list of columns to sort on
 * @returns {Table} `this`
 */

Table.prototype.sort = function(cmp) {
  if (typeof cmp == 'function') {
    this.rows.sort(cmp)
    return this
  }

  var keys = Array.isArray(cmp) ? cmp : this.columns()

  var comparators = keys.map(function(key) {
    var order = 'asc'
    var m = /(.*)\|\s*(asc|des)\s*$/.exec(key)
    if (m) {
      key = m[1]
      order = m[2]
    }
    return function (a, b) {
      return order == 'asc'
        ? compare(a[key], b[key])
        : compare(b[key], a[key])
    }
  })

  return this.sort(function(a, b) {
    for (var i = 0; i < comparators.length; i++) {
      var order = comparators[i](a, b)
      if (order != 0) return order
    }
    return 0
  })
}

function compare(a, b) {
  if (a === b) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  if (a === null) return 1
  if (b === null) return -1
  if (a > b) return 1
  if (a < b) return -1
  return compare(String(a), String(b))
}

/**
 * Add a total for the column
 *
 * @param {String} col - column name
 * @param {Object} [opts]
 * @param {Function} [opts.reduce = sum] - reduce(acc, val, idx, length) function to compute the total value
 * @param {Function} [opts.printer = padLeft] - Printer to format the total cell
 * @param {Any} [opts.init = 0] - Initial value for reduction
 * @returns {Table} `this`
 */

Table.prototype.total = function(col, opts) {
  opts = opts || {}
  this.totals = this.totals || {}
  this.totals[col] = {
    reduce: opts.reduce || Table.aggr.sum,
    printer: opts.printer || padLeft,
    init: opts.init == null ? 0 : opts.init
  }
  return this
}

/**
 * Predefined helpers for totals
 */

Table.aggr = {}

/**
 * Create a printer which formats the value with `printer`,
 * adds the `prefix` to it and right aligns the whole thing
 *
 * @param {String} prefix
 * @param {Function} printer
 * @returns {printer}
 */

Table.aggr.printer = function(prefix, printer) {
  printer = printer || string
  return function(val, width) {
    return padLeft(prefix + printer(val), width)
  }
}

/**
 * Sum reduction
 */

Table.aggr.sum = function(acc, val) {
  return acc + val
}

/**
 * Average reduction
 */

Table.aggr.avg = function(acc, val, idx, len) {
  acc = acc + val
  return idx + 1 == len ? acc/len : acc
}

/**
 * Print the array or object
 *
 * @param {Array|Object} obj - Object to print
 * @param {Function|Object} [format] - Format options
 * @param {Function} [cb] - Table post processing and formating
 * @returns {String}
 */

Table.print = function(obj, format, cb) {
  var opts = format || {}

  format = typeof format == 'function'
    ? format
    : function(obj, cell) {
      for(var key in obj) {
        if (!obj.hasOwnProperty(key)) continue
        var params = opts[key] || {}
        cell(params.name || key, obj[key], params.printer)
      }
    }

  var t = new Table
  var cell = t.cell.bind(t)

  if (Array.isArray(obj)) {
    cb = cb || function(t) { return t.toString() }
    obj.forEach(function(item) {
      format(item, cell)
      t.newRow()
    })
  } else {
    cb = cb || function(t) { return t.printTransposed({separator: ' : '}) }
    format(obj, cell)
    t.newRow()
  }

  return cb(t)
}

/**
 * Same as `Table.print()` but yields the result to `console.log()`
 */

Table.log = function(obj, format, cb) {
  console.log(Table.print(obj, format, cb))
}

/**
 * Same as `.toString()` but yields the result to `console.log()`
 */

Table.prototype.log = function() {
  console.log(this.toString())
}

},{}],7:[function(require,module,exports){
(function (global){

var rng;

if (global.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":7}],9:[function(require,module,exports){
var History = require('./src/history')
var Store = require('./src/store')
var Constraint = require('./src/constraint')
var dynamicCaller = require('./src/dynamic-caller')

module.exports = {
  History: History,
  Store: Store,
  Constraint: Constraint,
  Helper: {
    allDifferent: allDifferent,
    dynamicCaller: dynamicCaller,
    forEach: forEach
  }
}

function allDifferent (arr) {
  return arr.every(function (el1, ix) {
    return arr.slice(ix + 1).every(function (el2) {
      return el1 != el2 // eslint-disable-line eqeqeq
    })
  })
}

function forEach (arr, iterator, onEnd) {
  var indexes = Array.apply(null, Array(arr.length)).map(Number.prototype.valueOf, 0)
  forEachOnIndex(arr, indexes, iterator, onEnd)
}

function forEachOnIndex (arr, indexes, iterator, onEnd) {
  var iterablePosition = -1
  var values = []
  var value
  var ix

  var disjoint = true
  for (var position = 0; position < indexes.length; position++) {
    ix = indexes[position]

    if (typeof arr[position][ix] === 'undefined') {
      return onEnd()
    }
    value = arr[position][ix].toString()

    if (ix < arr[position].length - 1) {
      iterablePosition = position
    }

    if (values.indexOf(value) >= 0) {
      disjoint = false
      break
    }

    values.push(value)
  }

  function next () {
    if (iterablePosition === -1) {
      return onEnd()
    }

    // calculate next indexes
    if (iterablePosition > -1) {
      indexes[iterablePosition] += 1
      for (var ix = iterablePosition + 1; ix < indexes.length; ix++) {
        indexes[ix] = 0
      }
    }

    forEachOnIndex(arr, indexes, iterator, onEnd)
  }

  if (!disjoint) {
    return next()
  }

  iterator(values, next)
}

},{"./src/constraint":13,"./src/dynamic-caller":14,"./src/history":15,"./src/store":21}],10:[function(require,module,exports){
module.exports = fakeScope

var util = require('./util')
var indent = util.indent

function fakeScope (scope, expr, opts) {
  opts = opts || {}
  opts.isGuard = opts.isGuard || false

  // evaluate expression to get the function parameters
  // via dependency injection
  with (scope) {
    var func = eval('('+expr+')')
  }

  var params = util.getFunctionParameters(func || function(cb) { cb(true) })
  var lastParamName = util.getLastParamName(params)

  if (opts.isGuard) {
    var parts = [
      'new Promise(function (s, j) {',
      indent(1) + 'var ' + lastParamName + ' = function(r) { r ? s() : j() }',
      indent(1) + 'with (self.Scope) { (' + expr + ').apply(self, [' + params + ']) }',
      '})'
    ]
  } else {
    var parts = [
      'new Promise(function (s) {',
      indent(1) + 'var ' + lastParamName + ' = s',
      indent(1) + 'with (self.Scope) { (' + expr + ').apply(self, [' + params + ']) }',
      '})'
    ]
  }

  return parts
}



},{"./util":12}],11:[function(require,module,exports){
module.exports = Compiler

var util = require('./util')
var fakeScope = require('./fake-scope')

var indent = util.indent
var indentBy = util.indentBy
var destructuring = util.destructuring

function Compiler (rule, opts) {
  opts = opts || {}

  this.rule = rule

  this.replacements = opts.replacements || {}
  this.scope = opts.scope || {}

  this.opts = {
    this: opts.this || 'this',
    helper: opts.helper || 'self.Helper',
    defaultCallbackNames: opts.defaultCallbackNames || [ 'cb', 'callback' ]
  }
}

Compiler.prototype.headNo = function compileHeadNo (headNo) {
  var self = this
  headNo = headNo || 0
  var rule = this.rule
  var opts = this.opts

  if (!rule.head[headNo]) {
    throw new Error('No constraint with number ' + headNo + ' in this rule head')
  }

  var constraint = rule.head[headNo]
  if (constraint.type !== 'Constraint') {
    throw new Error('No constraint at number ' + headNo)
  }

  var parts = []
  var level = 0

  parts.push(
    indent(level) + 'var self = ' + opts.this,
    indent(level) + ''
  )

  if (constraint.arity > 0) {
    parts = parts.concat(destructuring(constraint, 'constraint.args').map(indentBy(level)))
    parts.push(
      indent(level)
    )
  }

  // start:def_constraintIds
  parts.push(
    indent(level) + 'var constraintIds = ['
  )

  rule.head.forEach(function (head, headIndex) {
    var line = headIndex === 0 ? indent(1) : ', '
    if (headIndex === headNo) {
      line += '[ constraint.id ]'
    } else {
      line += 'self.Store.lookup("' + head.name + '", ' + head.arity + ')'
    }
    parts.push(
      indent(level) + line
    )
  })

  parts.push(
    indent(level) + ']',
    indent(level) + ''
  )
  // end:def_constraintIds

  // start:return_promise
  parts.push(
    indent(level) + 'return new Promise(function (resolve, reject) {'
  )
  level += 1

  // start:def_iterator
  parts.push(
    indent(level) + this.opts.helper + '.forEach(constraintIds, function iterateConstraint (ids, callback) {'
  )
  level += 1

  // start:test_allAlive
  parts.push(
    indent(level) + 'if (!self.Store.allAlive(ids))',
    indent(level) + '  return callback()',
    indent(level)
  )
  // end:test_allAlive

  // start:test_ruleFired
  parts.push(
    indent(level) + 'if (self.History.has("' + rule.name + '", ids))',
    indent(level) + '  return callback()',
    indent(level)
  )
  // end:test_ruleFired

  // start:destructuring_other_constraints
  rule.head.forEach(function (head, headIndex) {
    if (headIndex === headNo) {
      return
    }

    if (head.arity > 0) {
      parts = parts.concat(destructuring(head, 'self.Store.args(ids[' + headIndex + '])').map(indentBy(level)))
      parts.push(
        indent(level)
      )
    }
  })
  // end:destructuring_other_constraints

  // start:guards_promises
  // generates something like:
  //   var guards = []
  if (rule.guard && rule.guard.length > 0) {
    parts = parts.concat(
      this.generateGuardPromisesArray().map(indentBy(level))
    )
    parts.push(
      indent(level) + 'Promise.all(guards)',
      indent(level) + '.then(function () {'
    )
    level += 1
  }

  parts.push(
    indent(level) + 'self.History.add("' + rule.name + '", ids)'
  )
  for (var k = rule.r + 1; k <= rule.head.length; k++) {
    // remove constraints
    parts.push(
      indent(level) + 'self.Store.kill(ids[' + (k - 1) + '])'
    )
  }

  // start:tells
  if (rule.body.length > 0) {
    parts.push(
      indent(level)
    )
    parts = parts.concat(self.generateTellPromises().map(indentBy(level)))
  } else {
    parts.push(
      indent(level) + 'callback()'
    )
  }
  // end: tells

  if (rule.guard && rule.guard.length > 0) {
    level -= 1
    parts.push(
      indent(level) + '})',
      indent(level) + '.catch(function () {',
      indent(level + 1) + ' callback()',
      indent(level) + '})'
    )
  }
  // end:guards_promises

  level -= 1
  parts.push(
    indent(level) + '}, resolve)'
  )
  // end:def_iterator

  level -= 1
  parts.push('})')
  // end:return_promise

  return parts
}

Compiler.prototype.generateGuardPromisesArray = function generateGuardPromisesArray () {
  var self = this
  var parts = []

  parts.push(
    'var guards = ['
  )

  this.rule.guard.forEach(function (guard, guardIndex) {
    var expr = guardIndex === 0 ? indent(1) : ', '

    if (guard.type === 'Replacement' && guard.hasOwnProperty('num')) {
      // get parameters via dependency injection
      var params = util.getFunctionParameters(self.replacements[guard.num])
      var lastParamName = util.getLastParamName(params)
      parts.push(
        expr + 'new Promise(function (s, j) {',
        indent(2) + 'var ' + lastParamName + ' = function (r) { r ? s() : j() }',
        indent(2) + 'replacements["' + guard.num + '"].apply(self, [' + params + '])',
        indent(1) + '})'
      )

      return
    }

    if (guard.type === 'Replacement' && guard.hasOwnProperty('expr')) {
      parts = parts.concat(fakeScope(self.scope, guard.expr.original, { isGuard: true }).map(function (row, rowId) {
        if (rowId === 0) {
          return expr + row
        }
        return indent(1) + row
      }))
      return
    }

    parts.push(
      expr + 'new Promise(function (s, j) { (' + self.generateGuard(guard) + ') ? s() : j() })'
    )
  })

  parts.push(
    ']',
    ''
  )

  return parts
}

Compiler.prototype.generateGuards = function generateGuards () {
  var self = this
  var rule = this.rule

  var expr = 'if ('
  var boolExprs = []
  rule.guard.forEach(function (guard) {
    if (guard.type !== 'Replacement') {
      boolExprs.push(self.generateGuard(guard))
    }
  })
  expr += boolExprs.join(' && ')
  expr += ') {'
  return expr
}

Compiler.prototype.generateGuard = function generateGuard (guard) {
  if (guard.type === 'BinaryExpression') {
    return this.generateBinaryExpression(guard)
  }

  return 'false'
}

Compiler.prototype.generateTellPromises = function generateTellPromises () {
  var self = this
  var parts = []

  parts.push('Promise.resolve()')

  this.rule.body.forEach(function (body, bodyIndex) {
    if (body.type === 'Constraint' && body.name === 'true' && body.arity === 0) {
      return
    }

    parts.push('.then(function () {')

    if (body.type === 'Constraint') {
      var expr = indent(1) + 'return self.' + body.name + '('
      expr += body.parameters.map(function (parameter) {
        return self.generateExpression(parameter)
      }).join(', ')
      expr += ')'
      parts.push(expr)
      parts.push('})')
      return
    }

    if (body.type === 'Replacement' && body.hasOwnProperty('expr')) {
      parts = parts.concat(fakeScope(self.scope, body.expr.original).map(function (row, rowId) {
        if (rowId === 0) {
          return 'return ' + row
        }
        return indent(1) + row
      }))
      parts.push('})')
      return
    }

    var params
    var lastParamName

    if (body.type === 'Replacement' && body.hasOwnProperty('num')) {
      // get parameters via dependency injection
      params = util.getFunctionParameters(self.replacements[body.num])
      lastParamName = util.getLastParamName(params)

      if (lastParamName && self.opts.defaultCallbackNames.indexOf(lastParamName) > -1) {
        // async
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + 'var ' + lastParamName + ' = s',
          indent(2) + 'replacements["' + body.num + '"].apply(self, [' + params + '])',
          indent(1) + '})',
          '})'
        )
      } else {
        // sync
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + 'replacements["' + body.num + '"].apply(self, [' + params + '])',
          indent(2) + 's()',
          indent(1) + '})',
          '})'
        )
      }
      return
    }

    if (body.type === 'Replacement' && body.hasOwnProperty('func')) {
      var func = eval(body.func) // eslint-disable-line
      params = util.getFunctionParameters(func)
      lastParamName = util.getLastParamName(params, true)

      if (lastParamName && self.opts.defaultCallbackNames.indexOf(lastParamName) > -1) {
        // async
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + '(' + body.func + ').apply(self, [' + util.replaceLastParam(params, 's') + '])',
          indent(1) + '})',
          '})'
        )
      } else {
        // sync
        parts.push(
          indent(1) + 'return new Promise(function (s) {',
          indent(2) + '(' + body.func + ').apply(self, [' + params + '])',
          indent(2) + 's()',
          indent(1) + '})',
          '})'
        )
      }

      return
    }
  })

  parts.push(
    '.then(function () {',
    indent(1) + 'callback()',
    '})',
    '.catch(function() {',
    indent(1) + 'reject()',
    '})'
  )

  return parts
}

Compiler.prototype.generateTell = function generateTell (body) {
  var self = this

  var expr = ''
  if (body.type === 'Constraint') {
    expr += 'self.' + body.name + '('
    expr += body.parameters.map(function (parameter) {
      return self.generateExpression(parameter)
    }).join(', ')
    expr += ')'

    return [ expr ]
  }

  if (body.type === 'Replacement') {
    if (body.hasOwnProperty('expr')) {
      return fakeScope(self.scope, body.expr.original)
    }

    return
  }

  expr += [
    'if (!(' + self.generateBinaryExpression(body) + ')) {',
    indent(1) + 'self.Store.invalidate()',
    indent(1) + 'return',
    '}'
  ].join('\n')
  return [ expr ]
}

Compiler.prototype.generateBinaryExpression = function generateBinaryExpression (expr) {
  var self = this

  return [ 'left', 'right' ].map(function (part) {
    if (expr[part].type === 'Identifier') {
      return expr[part].name
    }
    if (expr[part].type === 'Literal') {
      return expr[part].value
    }
    if (expr[part].type === 'BinaryExpression') {
      return '(' + self.generateBinaryExpression(expr[part]) + ')'
    }
  }).join(' ' + expr.operator + ' ')
}

Compiler.prototype.generateExpression = function generateExpression (parameter) {
  if (parameter.type === 'Identifier') {
    return parameter.name
  }
  if (parameter.type === 'BinaryExpression') {
    return this.generateBinaryExpression(parameter)
  }
  if (parameter.type === 'Literal') {
    return escape(parameter.value)
  }
}

function escape (val) {
  if (typeof val === 'string') {
    return '"' + val + '"'
  }

  return val
}

},{"./fake-scope":10,"./util":12}],12:[function(require,module,exports){
module.exports = {}
module.exports.indent = indent
module.exports.indentBy = indentBy
module.exports.destructuring = destructuring
module.exports.getFunctionParameters = getFunctionParameters
module.exports.getLastParamName = getLastParamName
module.exports.replaceLastParam = replaceLastParam
module.exports.isArrowFunction = isArrowFunction

function indent (level, text, spaces) {
  level = level || 0
  if (typeof text === 'number') {
    spaces = text
    text = null
  }
  spaces = spaces || 2
  text = text || null

  if (text && typeof text === 'string') {
    return text.split('\n').map(function (row) {
      return indent(level, spaces) + row
    }).join('\n')
  } else if (text && text instanceof Array) {
    return text.map(indentBy(level, spaces))
  }

  return Array(level * spaces + 1).join(' ')
}

function indentBy (level, spaces) {
  return function (str) {
    return indent(level, spaces) + str
  }
}

function destructuring (constraint, to) {
  var parts = []
  constraint.parameters.forEach(function (parameter, i) {
    if (parameter.type === 'Literal') {
      parts.push(indent(0) + 'if (' + to + '[' + i + '] !== ' + escape(parameter.value) + ') {')
      parts.push(indent(1) + 'return')
      parts.push(indent(0) + '}')
      return
    }

    var name = parameter.name
    if (parameter.type === 'ArrayExpression') {
      console.log('This feature needs native Destructuring (Array value).')

      name = parameter.original
    } else if (parameter.type === 'ObjectExpression') {
      console.info('This feature needs native Destructuring (Object value).')

      name = parameter.original
    }

    parts.push('var ' + name + ' = ' + to + '[' + i + ']')
  })
  return parts
}

function getFunctionParameters (func) {
  if (isArrowFunction(func)) {
    return func.toString().match(/^\(\s*([^\)]*)\)\s*=>/m)[1]
  } else {
    return func.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
  }
}

function getLastParamName (params) {
  return params.replace(/(^.*,|^)\s*([^,]+)$/g, '$2')
}

function replaceLastParam (params, replacement) {
  return params.replace(/((^.*,|^)\s*)([^,]+)$/g, '$1' + replacement)
}

function isArrowFunction (func) {
  return !func.hasOwnProperty('prototype')
}

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
module.exports = dynamicCaller

var Constraint = require('./constraint')

function dynamicCaller (name) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var arity = arguments.length
    var functor = name + '/' + arity

    if (typeof this.Constraints[functor] === 'undefined') {
      throw new Error('Constraint ' + functor + ' not defined.')
    }

    var constraint = new Constraint(name, arity, args)
    this.Store.add(constraint)

    var rules = []
    this.Rules.ForEach(function (rule) {
      if (rule[functor]) {
        rules.push(rule)
      }
    })

    var self = this

    return rules.reduce(function (curr, rule) {
      return curr.then(function () {
        return rule.Fire(self, constraint)
      })
    }, Promise.resolve())
  }
}

},{"./constraint":13}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
;(function () {
  var root = this
  var prevCHR
  if (root && root.CHR) {
    prevCHR = root.CHR
  }

  var Runtime = require('../runtime')
  var Rules = require('./rules')
  var Rule = require('./rule')
  var joinParts = require('./join-parts')

  var parse
  if ("browser" === 'browserWithoutParser') {
    parse = root.parseCHR
  } else {
    parse = require('./parser.peg.js').parse
  }

  function CHR (opts) {
    opts = opts || {}
    opts.store = opts.store || new Runtime.Store()
    opts.history = opts.history || new Runtime.History()
    opts.rules = opts.rules || new Rules(tag)
    opts.scope = opts.scope || {}

    /**
     * Adds a number of rules given.
     */
    function tag (chrSource) {
      var program
      var replacements

      // Examine caller format
      if (typeof chrSource === 'object' && chrSource.type && chrSource.type === 'Program') {
        // called with already parsed source code
        // e.g. tag({ type: 'Program', body: [ ... ] })
        program = chrSource
        replacements = []

        // allow to specify replacements as second argument
        if (arguments[1] && typeof arguments[1] === 'object' && arguments[1] instanceof Array) {
          replacements = arguments[1]
        }
      } else if (typeof chrSource === 'object' && chrSource instanceof Array && typeof chrSource[0] === 'string') {
        // called as template tag
        // e.g. tag`a ==> b`
        // or   tag`a ==> ${ function() { console.log('Replacement test') } }`
        var combined = [
          chrSource[0]
        ]
        Array.prototype.slice.call(arguments, 1).forEach(function (repl, ix) {
          combined.push(repl)
          combined.push(chrSource[ix + 1])
        })
        chrSource = joinParts(combined)
        replacements = Array.prototype.slice.call(arguments, 1)
        program = parse(chrSource)
      } else if (typeof chrSource === 'string' && arguments[1] && arguments[1] instanceof Array) {
        // called with program and replacements array
        // e.g. tag(
        //        'a ==> ${ function() { console.log("Replacement test") } }',
        //        [ eval('( function() { console.log("Replacement test") } )') ]
        //      )
        // this is useful to ensure the scope of the given replacements
        program = parse(chrSource)
        replacements = arguments[1]
      } else if (typeof chrSource === 'string') {
        // called as normal function
        // e.g. tag('a ==> b')
        // or   tag('a ==> ', function() { console.log('Replacement test') })
        replacements = Array.prototype.filter.call(arguments, isFunction)
        chrSource = joinParts(Array.prototype.slice.call(arguments))
        program = parse(chrSource)
      }

      var rules = program.body
      rules.forEach(function (rule) {
        tag.Rules.Add(rule, replacements)
      })
    }

    tag.Store = opts.store
    tag.History = opts.history
    tag.Rules = opts.rules
    tag.Scope = opts.scope

    // this will save all constraint functors with
    //   an array of the rules they occur in
    tag.Constraints = {}

    Object.defineProperty(tag, 'Functors', {
      get: function () {
        return Object.keys(tag.Constraints)
      }
    })

    tag.Helper = Runtime.Helper

    return tag
  }

  // expose public constructors
  CHR.Constraint = Runtime.Constraint
  CHR.Store = Runtime.Store
  CHR.History = Runtime.History
  CHR.Rule = Rule

  CHR.version = '2.0.5'

  CHR.noConflict = function () {
    root.CHR = prevCHR
    return CHR
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = CHR
    } else {
      exports.CHR = CHR
    }
  } else {
    root.CHR = CHR
  }

  function isFunction (el) {
    return typeof el === 'function'
  }
}).call(this)

},{"../runtime":9,"./join-parts":17,"./parser.peg.js":18,"./rule":19,"./rules":20}],17:[function(require,module,exports){
module.exports = joinParts

function joinParts (arr) {
  var res = arr[0].trim()
  var replacementNo = 0

  arr.forEach(function (el, ix) {
    if (ix === 0) {
      // omit first
      return
    }

    if (typeof el === 'string') {
      var str = el.trim()
      if (str.length === 0) {
        return
      }

      if (isComma(str)) {
        res += ','
        return
      }

      if (isPipe(str)) {
        res += ' |'
        return
      }

      if (startsWithSeparator(el)) {
        if (startsWithPipe(el) && res.slice(-1)[0] !== ' ') {
          res += ' '
        }
      } else {
        if (needsComma(res)) {
          res += ', '
        }
      }

      res += str
      return
    }

    if (typeof el === 'function') {
      if (needsComma(res)) {
        // add comma
        res += ','
      }

      res += ' ${' + replacementNo + '}'
      replacementNo++
      return
    }
  })

  return res
}

function needsComma (str) {
  return !str.match(/[,|>]\s*$/)
}

function startsWithSeparator (str) {
  return str.match(/^\s*[,|]/)
}

function startsWithPipe (str) {
  return str.match(/^\s*\|/)
}

function isComma (str) {
  return str.match(/^\s*,\s*$/)
}

function isPipe (str) {
  return str.match(/^\s*\|\s*$/)
}

},{}],18:[function(require,module,exports){
module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleIndices = { Program: 230, ProgramWithPreamble: 0, Query: 10 },
        peg$startRuleIndex   = 230,

        peg$consts = [
          function(preamble, program) {
                program.preamble = preamble
                program.replacements = []
                program.body.forEach(function (rule) {
                  program.replacements = program.replacements.concat(rule.replacements)
                })
                return program
              },
          function(source) {
                return source
              },
          function(source) {
                return text()
              },
          function() {
                return ''
              },
          function(name, rule) {
                if (name) {
                  rule.name = name;
                }
                rule.original = text()
                rule.location = location()
                return rule;
              },
          "==>",
          { type: "literal", value: "==>", description: "\"==>\"" },
          function(headConstraints, guard, bodyConstraints) {
                var desc = {
                  type: 'PropagationRule',
                  kept: headConstraints,
                  removed: [],
                  body: bodyConstraints,
                  guard: guard || []
                };
                desc = formatRule(desc);
                return desc;
              },
          "<=>",
          { type: "literal", value: "<=>", description: "\"<=>\"" },
          function(headConstraints, guard, bodyConstraints) {
                var desc = {
                  type: 'SimplificationRule',
                  kept: [],
                  removed: headConstraints,
                  body: bodyConstraints,
                  guard: guard || []
                };
                desc = formatRule(desc);
                return desc;
              },
          "\\",
          { type: "literal", value: "\\", description: "\"\\\\\"" },
          "/",
          { type: "literal", value: "/", description: "\"/\"" },
          function(keptConstraints, removedConstraints, guard, bodyConstraints) {
                var desc = {
                  type: 'SimpagationRule',
                  kept: keptConstraints,
                  removed: removedConstraints,
                  body: bodyConstraints,
                  guard: guard || []
                };
                desc = formatRule(desc);
                return desc;
              },
          "@",
          { type: "literal", value: "@", description: "\"@\"" },
          function(identifier) {
                return identifier;
              },
          /^[a-z0-9_]/,
          { type: "class", value: "[a-z0-9_]", description: "[a-z0-9_]" },
          function(chars) {
                return chars.join('').trim();
              },
          ",",
          { type: "literal", value: ",", description: "\",\"" },
          function(first, rest) {
                return buildList(first, rest, 3);
              },
          "(",
          { type: "literal", value: "(", description: "\"(\"" },
          ")",
          { type: "literal", value: ")", description: "\")\"" },
          function(constraintName, parameters) {
                var desc = { 
                  type: 'Constraint',
                  name: constraintName,
                  parameters: extractOptional(parameters, 2, []),
                  original: text()
                };
                if (desc.parameters === null) {
                  desc.parameters = [];
                }
                desc.arity = desc.parameters.length
                desc.functor = desc.name + '/' + desc.arity;
                return desc;
              },
          function(expression) {
                expression.original = text();
                return expression;
              },
          function(constraintName, parameters) {
                var desc = { 
                  type: 'Constraint',
                  name: constraintName,
                  parameters: extractOptional(parameters, 2, []),
                  original: text(),
                  location: location()
                };
                if (desc.parameters === null) {
                  desc.parameters = [];
                }
                desc.arity = desc.parameters.length
                desc.functor = desc.name + '/' + desc.arity;
                return desc;
              },
          function(constraintName, parameters) {
                var desc = { 
                  type: 'Constraint',
                  name: constraintName,
                  parameters: extractOptional(parameters, 2, []),
                  original: text()
                };
                if (desc.parameters === null) {
                  desc.parameters = [];
                }
                desc.arity = desc.parameters.length
                desc.functor = desc.name + '/' + desc.arity
                return desc;
              },
          /^[a-z]/,
          { type: "class", value: "[a-z]", description: "[a-z]" },
          /^[A-z0-9_]/,
          { type: "class", value: "[A-z0-9_]", description: "[A-z0-9_]" },
          function(first, following) {
                return first+following.join('');
              },
          "|",
          { type: "literal", value: "|", description: "\"|\"" },
          function(guard) {
                return guard;
              },
          function(num) {
                return {
                  type: 'Replacement',
                  num: parseInt(num)
                };
              },
          function(func) {
                return {
                  type: 'Replacement',
                  expr: func
                };
              },
          function(func) {
                return {
                  type: 'Replacement',
                  func: func
                };
              },
          function(expr) {
                return {
                  type: 'Replacement',
                  expr: {
                    type: 'SourceCode',
                    original: expr
                  }
                };
              },
          "${",
          { type: "literal", value: "${", description: "\"${\"" },
          "{",
          { type: "literal", value: "{", description: "\"{\"" },
          "}",
          { type: "literal", value: "}", description: "\"}\"" },
          "=>",
          { type: "literal", value: "=>", description: "\"=>\"" },
          function(params, body) {
                var desc = {
                  type: 'ArrowFunction',
                  original: text(),
                  params: [],
                  body: body
                }
                if (params) {
                  desc.params = params
                }
                return desc;
              },
          function(expression) {
                if (expression.type === 'SequenceExpression') {
                  return expression.expressions;
                }
                if (!(expression instanceof Array)) {
                  return [ expression ]
                }
                return expression
              },
          "[",
          { type: "literal", value: "[", description: "\"[\"" },
          "]",
          { type: "literal", value: "]", description: "\"]\"" },
          function(elision) {
                return {
                  type:     "ArrayExpression",
                  elements: optionalList(extractOptional(elision, 0))
                };
              },
          function(elements) {
                return {
                  type:     "ArrayExpression",
                  elements: elements
                };
              },
          function(elements, elision) {
                return {
                  type:     "ArrayExpression",
                  elements: elements.concat(optionalList(extractOptional(elision, 0)))
                };
              },
          function(elision, element) {
                  return optionalList(extractOptional(elision, 0)).concat(element);
                },
          function(first, elision, element) {
                  return optionalList(extractOptional(elision, 0)).concat(element);
                },
          function(first, rest) { return Array.prototype.concat.apply(first, rest); },
          function() { return { type: "ObjectExpression", properties: [] }; },
          function(properties) {
                 return { type: "ObjectExpression", properties: properties };
               },
          ":",
          { type: "literal", value: ":", description: "\":\"" },
          function(key, value) {
                return { key: key, value: value, kind: "init" };
              },
          function(first, rest) {
                return rest.length > 0
                  ? { type: "SequenceExpression", expressions: buildList(first, rest, 3) }
                  : first;
              },
          "=",
          { type: "literal", value: "=", description: "\"=\"" },
          function(left, right) {
                return {
                  type:     "AssignmentExpression",
                  operator: "=",
                  left:     left,
                  right:    right
                };
              },
          function(left, operator, right) {
                return {
                  type:     "AssignmentExpression",
                  operator: operator,
                  left:     left,
                  right:    right
                };
              },
          "?",
          { type: "literal", value: "?", description: "\"?\"" },
          function(test, consequent, alternate) {
                return {
                  type:       "ConditionalExpression",
                  test:       test,
                  consequent: consequent,
                  alternate:  alternate
                };
              },
          "LogicalOROperator",
          { type: "literal", value: "LogicalOROperator", description: "\"LogicalOROperator\"" },
          function(first, rest) { return buildBinaryExpression(first, rest); },
          { type: "any", description: "any character" },
          { type: "other", description: "whitespace" },
          "\t",
          { type: "literal", value: "\t", description: "\"\\t\"" },
          "\x0B",
          { type: "literal", value: "\x0B", description: "\"\\x0B\"" },
          "\f",
          { type: "literal", value: "\f", description: "\"\\f\"" },
          " ",
          { type: "literal", value: " ", description: "\" \"" },
          "\xA0",
          { type: "literal", value: "\xA0", description: "\"\\xA0\"" },
          "\uFEFF",
          { type: "literal", value: "\uFEFF", description: "\"\\uFEFF\"" },
          /^[\n\r\u2028\u2029]/,
          { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
          { type: "other", description: "end of line" },
          "\n",
          { type: "literal", value: "\n", description: "\"\\n\"" },
          "\r\n",
          { type: "literal", value: "\r\n", description: "\"\\r\\n\"" },
          "\r",
          { type: "literal", value: "\r", description: "\"\\r\"" },
          "\u2028",
          { type: "literal", value: "\u2028", description: "\"\\u2028\"" },
          "\u2029",
          { type: "literal", value: "\u2029", description: "\"\\u2029\"" },
          { type: "other", description: "comment" },
          "/*",
          { type: "literal", value: "/*", description: "\"/*\"" },
          "*/",
          { type: "literal", value: "*/", description: "\"*/\"" },
          "//",
          { type: "literal", value: "//", description: "\"//\"" },
          function(name) { return name; },
          { type: "other", description: "identifier" },
          function(first, rest) {
                return {
                  type: "Identifier",
                  name: first + rest.join("")
                };
              },
          "$",
          { type: "literal", value: "$", description: "\"$\"" },
          "_",
          { type: "literal", value: "_", description: "\"_\"" },
          function(sequence) { return sequence; },
          "\u200C",
          { type: "literal", value: "\u200C", description: "\"\\u200C\"" },
          "\u200D",
          { type: "literal", value: "\u200D", description: "\"\\u200D\"" },
          function() { return { type: "Literal", value: null }; },
          function() { return { type: "Literal", value: true  }; },
          function() { return { type: "Literal", value: false }; },
          { type: "other", description: "number" },
          function(literal) {
                return literal;
              },
          ".",
          { type: "literal", value: ".", description: "\".\"" },
          function() {
                return { type: "Literal", value: parseFloat(text()) };
              },
          "0",
          { type: "literal", value: "0", description: "\"0\"" },
          /^[0-9]/,
          { type: "class", value: "[0-9]", description: "[0-9]" },
          /^[1-9]/,
          { type: "class", value: "[1-9]", description: "[1-9]" },
          "e",
          { type: "literal", value: "e", description: "\"e\"" },
          /^[+\-]/,
          { type: "class", value: "[+-]", description: "[+-]" },
          "0x",
          { type: "literal", value: "0x", description: "\"0x\"" },
          function(digits) {
                return { type: "Literal", value: parseInt(digits, 16) };
               },
          /^[0-9a-f]/i,
          { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
          { type: "other", description: "string" },
          "\"",
          { type: "literal", value: "\"", description: "\"\\\"\"" },
          function(chars) {
                return { type: "Literal", value: chars.join("") };
              },
          "'",
          { type: "literal", value: "'", description: "\"'\"" },
          function() { return text(); },
          function() { return ""; },
          function() { return "\0"; },
          "b",
          { type: "literal", value: "b", description: "\"b\"" },
          function() { return "\b";   },
          "f",
          { type: "literal", value: "f", description: "\"f\"" },
          function() { return "\f";   },
          "n",
          { type: "literal", value: "n", description: "\"n\"" },
          function() { return "\n";   },
          "r",
          { type: "literal", value: "r", description: "\"r\"" },
          function() { return "\r";   },
          "t",
          { type: "literal", value: "t", description: "\"t\"" },
          function() { return "\t";   },
          "v",
          { type: "literal", value: "v", description: "\"v\"" },
          function() { return "\x0B"; },
          "x",
          { type: "literal", value: "x", description: "\"x\"" },
          "u",
          { type: "literal", value: "u", description: "\"u\"" },
          function(digits) {
                return String.fromCharCode(parseInt(digits, 16));
              },
          { type: "other", description: "regular expression" },
          function(pattern, flags) {
                var value;

                try {
                  value = new RegExp(pattern, flags);
                } catch (e) {
                  error(e.message);
                }

                return { type: "Literal", value: value };
              },
          /^[*\\\/[]/,
          { type: "class", value: "[*\\\\/[]", description: "[*\\\\/[]" },
          /^[\\\/[]/,
          { type: "class", value: "[\\\\/[]", description: "[\\\\/[]" },
          /^[\]\\]/,
          { type: "class", value: "[\\]\\\\]", description: "[\\]\\\\]" },
          /^[a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137-\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148-\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C-\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA-\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9-\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC-\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF-\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F-\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0-\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB-\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE-\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0561-\u0587\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6-\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FC7\u1FD0-\u1FD3\u1FD6-\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6-\u1FF7\u210A\u210E-\u210F\u2113\u212F\u2134\u2139\u213C-\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65-\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73-\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3-\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7FA\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A]/,
          { type: "class", value: "[\\u0061-\\u007A\\u00B5\\u00DF-\\u00F6\\u00F8-\\u00FF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137-\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148-\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E-\\u0180\\u0183\\u0185\\u0188\\u018C-\\u018D\\u0192\\u0195\\u0199-\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA-\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9-\\u01BA\\u01BD-\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC-\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF-\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233-\\u0239\\u023C\\u023F-\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F-\\u0293\\u0295-\\u02AF\\u0371\\u0373\\u0377\\u037B-\\u037D\\u0390\\u03AC-\\u03CE\\u03D0-\\u03D1\\u03D5-\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF-\\u03F3\\u03F5\\u03F8\\u03FB-\\u03FC\\u0430-\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE-\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7\\u04D9\\u04DB\\u04DD\\u04DF\\u04E1\\u04E3\\u04E5\\u04E7\\u04E9\\u04EB\\u04ED\\u04EF\\u04F1\\u04F3\\u04F5\\u04F7\\u04F9\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0525\\u0527\\u0561-\\u0587\\u1D00-\\u1D2B\\u1D6B-\\u1D77\\u1D79-\\u1D9A\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95-\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF-\\u1F07\\u1F10-\\u1F15\\u1F20-\\u1F27\\u1F30-\\u1F37\\u1F40-\\u1F45\\u1F50-\\u1F57\\u1F60-\\u1F67\\u1F70-\\u1F7D\\u1F80-\\u1F87\\u1F90-\\u1F97\\u1FA0-\\u1FA7\\u1FB0-\\u1FB4\\u1FB6-\\u1FB7\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FC7\\u1FD0-\\u1FD3\\u1FD6-\\u1FD7\\u1FE0-\\u1FE7\\u1FF2-\\u1FF4\\u1FF6-\\u1FF7\\u210A\\u210E-\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C-\\u213D\\u2146-\\u2149\\u214E\\u2184\\u2C30-\\u2C5E\\u2C61\\u2C65-\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73-\\u2C74\\u2C76-\\u2C7B\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3-\\u2CE4\\u2CEC\\u2CEE\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA661\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F-\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F\\uA771-\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uA78E\\uA791\\uA793\\uA7A1\\uA7A3\\uA7A5\\uA7A7\\uA7A9\\uA7FA\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFF41-\\uFF5A]", description: "[\\u0061-\\u007A\\u00B5\\u00DF-\\u00F6\\u00F8-\\u00FF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137-\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148-\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E-\\u0180\\u0183\\u0185\\u0188\\u018C-\\u018D\\u0192\\u0195\\u0199-\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA-\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9-\\u01BA\\u01BD-\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC-\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF-\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233-\\u0239\\u023C\\u023F-\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F-\\u0293\\u0295-\\u02AF\\u0371\\u0373\\u0377\\u037B-\\u037D\\u0390\\u03AC-\\u03CE\\u03D0-\\u03D1\\u03D5-\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF-\\u03F3\\u03F5\\u03F8\\u03FB-\\u03FC\\u0430-\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE-\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7\\u04D9\\u04DB\\u04DD\\u04DF\\u04E1\\u04E3\\u04E5\\u04E7\\u04E9\\u04EB\\u04ED\\u04EF\\u04F1\\u04F3\\u04F5\\u04F7\\u04F9\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0525\\u0527\\u0561-\\u0587\\u1D00-\\u1D2B\\u1D6B-\\u1D77\\u1D79-\\u1D9A\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95-\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF-\\u1F07\\u1F10-\\u1F15\\u1F20-\\u1F27\\u1F30-\\u1F37\\u1F40-\\u1F45\\u1F50-\\u1F57\\u1F60-\\u1F67\\u1F70-\\u1F7D\\u1F80-\\u1F87\\u1F90-\\u1F97\\u1FA0-\\u1FA7\\u1FB0-\\u1FB4\\u1FB6-\\u1FB7\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FC7\\u1FD0-\\u1FD3\\u1FD6-\\u1FD7\\u1FE0-\\u1FE7\\u1FF2-\\u1FF4\\u1FF6-\\u1FF7\\u210A\\u210E-\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C-\\u213D\\u2146-\\u2149\\u214E\\u2184\\u2C30-\\u2C5E\\u2C61\\u2C65-\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73-\\u2C74\\u2C76-\\u2C7B\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3-\\u2CE4\\u2CEC\\u2CEE\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA661\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F-\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F\\uA771-\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uA78E\\uA791\\uA793\\uA7A1\\uA7A3\\uA7A5\\uA7A7\\uA7A9\\uA7FA\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFF41-\\uFF5A]" },
          /^[\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5-\u06E6\u07F4-\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C-\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D-\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA717-\uA71F\uA770\uA788\uA7F8-\uA7F9\uA9CF\uAA70\uAADD\uAAF3-\uAAF4\uFF70\uFF9E-\uFF9F]/,
          { type: "class", value: "[\\u02B0-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0374\\u037A\\u0559\\u0640\\u06E5-\\u06E6\\u07F4-\\u07F5\\u07FA\\u081A\\u0824\\u0828\\u0971\\u0E46\\u0EC6\\u10FC\\u17D7\\u1843\\u1AA7\\u1C78-\\u1C7D\\u1D2C-\\u1D6A\\u1D78\\u1D9B-\\u1DBF\\u2071\\u207F\\u2090-\\u209C\\u2C7C-\\u2C7D\\u2D6F\\u2E2F\\u3005\\u3031-\\u3035\\u303B\\u309D-\\u309E\\u30FC-\\u30FE\\uA015\\uA4F8-\\uA4FD\\uA60C\\uA67F\\uA717-\\uA71F\\uA770\\uA788\\uA7F8-\\uA7F9\\uA9CF\\uAA70\\uAADD\\uAAF3-\\uAAF4\\uFF70\\uFF9E-\\uFF9F]", description: "[\\u02B0-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0374\\u037A\\u0559\\u0640\\u06E5-\\u06E6\\u07F4-\\u07F5\\u07FA\\u081A\\u0824\\u0828\\u0971\\u0E46\\u0EC6\\u10FC\\u17D7\\u1843\\u1AA7\\u1C78-\\u1C7D\\u1D2C-\\u1D6A\\u1D78\\u1D9B-\\u1DBF\\u2071\\u207F\\u2090-\\u209C\\u2C7C-\\u2C7D\\u2D6F\\u2E2F\\u3005\\u3031-\\u3035\\u303B\\u309D-\\u309E\\u30FC-\\u30FE\\uA015\\uA4F8-\\uA4FD\\uA60C\\uA67F\\uA717-\\uA71F\\uA770\\uA788\\uA7F8-\\uA7F9\\uA9CF\\uAA70\\uAADD\\uAAF3-\\uAAF4\\uFF70\\uFF9E-\\uFF9F]" },
          /^[\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0977\u0979-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A-\uA62B\uA66E\uA6A0-\uA6E5\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
          { type: "class", value: "[\\u00AA\\u00BA\\u01BB\\u01C0-\\u01C3\\u0294\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u063F\\u0641-\\u064A\\u066E-\\u066F\\u0671-\\u06D3\\u06D5\\u06EE-\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u0800-\\u0815\\u0840-\\u0858\\u08A0\\u08A2-\\u08AC\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0972-\\u0977\\u0979-\\u097F\\u0985-\\u098C\\u098F-\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC-\\u09DD\\u09DF-\\u09E1\\u09F0-\\u09F1\\u0A05-\\u0A0A\\u0A0F-\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32-\\u0A33\\u0A35-\\u0A36\\u0A38-\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2-\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0-\\u0AE1\\u0B05-\\u0B0C\\u0B0F-\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32-\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C-\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99-\\u0B9A\\u0B9C\\u0B9E-\\u0B9F\\u0BA3-\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58-\\u0C59\\u0C60-\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0-\\u0CE1\\u0CF1-\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32-\\u0E33\\u0E40-\\u0E45\\u0E81-\\u0E82\\u0E84\\u0E87-\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA-\\u0EAB\\u0EAD-\\u0EB0\\u0EB2-\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065-\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10D0-\\u10FA\\u10FD-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17DC\\u1820-\\u1842\\u1844-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE-\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C77\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5-\\u1CF6\\u2135-\\u2138\\u2D30-\\u2D67\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u3006\\u303C\\u3041-\\u3096\\u309F\\u30A1-\\u30FA\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA014\\uA016-\\uA48C\\uA4D0-\\uA4F7\\uA500-\\uA60B\\uA610-\\uA61F\\uA62A-\\uA62B\\uA66E\\uA6A0-\\uA6E5\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA6F\\uAA71-\\uAA76\\uAA7A\\uAA80-\\uAAAF\\uAAB1\\uAAB5-\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADC\\uAAE0-\\uAAEA\\uAAF2\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40-\\uFB41\\uFB43-\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF66-\\uFF6F\\uFF71-\\uFF9D\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]", description: "[\\u00AA\\u00BA\\u01BB\\u01C0-\\u01C3\\u0294\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u063F\\u0641-\\u064A\\u066E-\\u066F\\u0671-\\u06D3\\u06D5\\u06EE-\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u0800-\\u0815\\u0840-\\u0858\\u08A0\\u08A2-\\u08AC\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0972-\\u0977\\u0979-\\u097F\\u0985-\\u098C\\u098F-\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC-\\u09DD\\u09DF-\\u09E1\\u09F0-\\u09F1\\u0A05-\\u0A0A\\u0A0F-\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32-\\u0A33\\u0A35-\\u0A36\\u0A38-\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2-\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0-\\u0AE1\\u0B05-\\u0B0C\\u0B0F-\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32-\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C-\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99-\\u0B9A\\u0B9C\\u0B9E-\\u0B9F\\u0BA3-\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58-\\u0C59\\u0C60-\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0-\\u0CE1\\u0CF1-\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32-\\u0E33\\u0E40-\\u0E45\\u0E81-\\u0E82\\u0E84\\u0E87-\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA-\\u0EAB\\u0EAD-\\u0EB0\\u0EB2-\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065-\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10D0-\\u10FA\\u10FD-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17DC\\u1820-\\u1842\\u1844-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE-\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C77\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5-\\u1CF6\\u2135-\\u2138\\u2D30-\\u2D67\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u3006\\u303C\\u3041-\\u3096\\u309F\\u30A1-\\u30FA\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA014\\uA016-\\uA48C\\uA4D0-\\uA4F7\\uA500-\\uA60B\\uA610-\\uA61F\\uA62A-\\uA62B\\uA66E\\uA6A0-\\uA6E5\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA6F\\uAA71-\\uAA76\\uAA7A\\uAA80-\\uAAAF\\uAAB1\\uAAB5-\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADC\\uAAE0-\\uAAEA\\uAAF2\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40-\\uFB41\\uFB43-\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF66-\\uFF6F\\uFF71-\\uFF9D\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]" },
          /^[\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC]/,
          { type: "class", value: "[\\u01C5\\u01C8\\u01CB\\u01F2\\u1F88-\\u1F8F\\u1F98-\\u1F9F\\u1FA8-\\u1FAF\\u1FBC\\u1FCC\\u1FFC]", description: "[\\u01C5\\u01C8\\u01CB\\u01F2\\u1F88-\\u1F8F\\u1F98-\\u1F9F\\u1FA8-\\u1FAF\\u1FBC\\u1FCC\\u1FFC]" },
          /^[A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178-\u0179\u017B\u017D\u0181-\u0182\u0184\u0186-\u0187\u0189-\u018B\u018E-\u0191\u0193-\u0194\u0196-\u0198\u019C-\u019D\u019F-\u01A0\u01A2\u01A4\u01A6-\u01A7\u01A9\u01AC\u01AE-\u01AF\u01B1-\u01B3\u01B5\u01B7-\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A-\u023B\u023D-\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u0386\u0388-\u038A\u038C\u038E-\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9-\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0-\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E-\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D-\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA\uFF21-\uFF3A]/,
          { type: "class", value: "[\\u0041-\\u005A\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178-\\u0179\\u017B\\u017D\\u0181-\\u0182\\u0184\\u0186-\\u0187\\u0189-\\u018B\\u018E-\\u0191\\u0193-\\u0194\\u0196-\\u0198\\u019C-\\u019D\\u019F-\\u01A0\\u01A2\\u01A4\\u01A6-\\u01A7\\u01A9\\u01AC\\u01AE-\\u01AF\\u01B1-\\u01B3\\u01B5\\u01B7-\\u01B8\\u01BC\\u01C4\\u01C7\\u01CA\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F4\\u01F6-\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A-\\u023B\\u023D-\\u023E\\u0241\\u0243-\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u038F\\u0391-\\u03A1\\u03A3-\\u03AB\\u03CF\\u03D2-\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9-\\u03FA\\u03FD-\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0\\u04B2\\u04B4\\u04B6\\u04B8\\u04BA\\u04BC\\u04BE\\u04C0-\\u04C1\\u04C3\\u04C5\\u04C7\\u04C9\\u04CB\\u04CD\\u04D0\\u04D2\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0524\\u0526\\u0531-\\u0556\\u10A0-\\u10C5\\u10C7\\u10CD\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08-\\u1F0F\\u1F18-\\u1F1D\\u1F28-\\u1F2F\\u1F38-\\u1F3F\\u1F48-\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68-\\u1F6F\\u1FB8-\\u1FBB\\u1FC8-\\u1FCB\\u1FD8-\\u1FDB\\u1FE8-\\u1FEC\\u1FF8-\\u1FFB\\u2102\\u2107\\u210B-\\u210D\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u2130-\\u2133\\u213E-\\u213F\\u2145\\u2183\\u2C00-\\u2C2E\\u2C60\\u2C62-\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D-\\u2C70\\u2C72\\u2C75\\u2C7E-\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\u2CEB\\u2CED\\u2CF2\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA660\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D-\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uA78D\\uA790\\uA792\\uA7A0\\uA7A2\\uA7A4\\uA7A6\\uA7A8\\uA7AA\\uFF21-\\uFF3A]", description: "[\\u0041-\\u005A\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178-\\u0179\\u017B\\u017D\\u0181-\\u0182\\u0184\\u0186-\\u0187\\u0189-\\u018B\\u018E-\\u0191\\u0193-\\u0194\\u0196-\\u0198\\u019C-\\u019D\\u019F-\\u01A0\\u01A2\\u01A4\\u01A6-\\u01A7\\u01A9\\u01AC\\u01AE-\\u01AF\\u01B1-\\u01B3\\u01B5\\u01B7-\\u01B8\\u01BC\\u01C4\\u01C7\\u01CA\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F4\\u01F6-\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A-\\u023B\\u023D-\\u023E\\u0241\\u0243-\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u038F\\u0391-\\u03A1\\u03A3-\\u03AB\\u03CF\\u03D2-\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9-\\u03FA\\u03FD-\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0\\u04B2\\u04B4\\u04B6\\u04B8\\u04BA\\u04BC\\u04BE\\u04C0-\\u04C1\\u04C3\\u04C5\\u04C7\\u04C9\\u04CB\\u04CD\\u04D0\\u04D2\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0524\\u0526\\u0531-\\u0556\\u10A0-\\u10C5\\u10C7\\u10CD\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08-\\u1F0F\\u1F18-\\u1F1D\\u1F28-\\u1F2F\\u1F38-\\u1F3F\\u1F48-\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68-\\u1F6F\\u1FB8-\\u1FBB\\u1FC8-\\u1FCB\\u1FD8-\\u1FDB\\u1FE8-\\u1FEC\\u1FF8-\\u1FFB\\u2102\\u2107\\u210B-\\u210D\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u2130-\\u2133\\u213E-\\u213F\\u2145\\u2183\\u2C00-\\u2C2E\\u2C60\\u2C62-\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D-\\u2C70\\u2C72\\u2C75\\u2C7E-\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\u2CEB\\u2CED\\u2CF2\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA660\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D-\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uA78D\\uA790\\uA792\\uA7A0\\uA7A2\\uA7A4\\uA7A6\\uA7A8\\uA7AA\\uFF21-\\uFF3A]" },
          /^[\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E-\u094F\u0982-\u0983\u09BE-\u09C0\u09C7-\u09C8\u09CB-\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB-\u0ACC\u0B02-\u0B03\u0B3E\u0B40\u0B47-\u0B48\u0B4B-\u0B4C\u0B57\u0BBE-\u0BBF\u0BC1-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82-\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7-\u0CC8\u0CCA-\u0CCB\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82-\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2-\u0DF3\u0F3E-\u0F3F\u0F7F\u102B-\u102C\u1031\u1038\u103B-\u103C\u1056-\u1057\u1062-\u1064\u1067-\u106D\u1083-\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7-\u17C8\u1923-\u1926\u1929-\u192B\u1930-\u1931\u1933-\u1938\u19B0-\u19C0\u19C8-\u19C9\u1A19-\u1A1A\u1A55\u1A57\u1A61\u1A63-\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B44\u1B82\u1BA1\u1BA6-\u1BA7\u1BAA\u1BAC-\u1BAD\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2-\u1BF3\u1C24-\u1C2B\u1C34-\u1C35\u1CE1\u1CF2-\u1CF3\u302E-\u302F\uA823-\uA824\uA827\uA880-\uA881\uA8B4-\uA8C3\uA952-\uA953\uA983\uA9B4-\uA9B5\uA9BA-\uA9BB\uA9BD-\uA9C0\uAA2F-\uAA30\uAA33-\uAA34\uAA4D\uAA7B\uAAEB\uAAEE-\uAAEF\uAAF5\uABE3-\uABE4\uABE6-\uABE7\uABE9-\uABEA\uABEC]/,
          { type: "class", value: "[\\u0903\\u093B\\u093E-\\u0940\\u0949-\\u094C\\u094E-\\u094F\\u0982-\\u0983\\u09BE-\\u09C0\\u09C7-\\u09C8\\u09CB-\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB-\\u0ACC\\u0B02-\\u0B03\\u0B3E\\u0B40\\u0B47-\\u0B48\\u0B4B-\\u0B4C\\u0B57\\u0BBE-\\u0BBF\\u0BC1-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82-\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7-\\u0CC8\\u0CCA-\\u0CCB\\u0CD5-\\u0CD6\\u0D02-\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82-\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2-\\u0DF3\\u0F3E-\\u0F3F\\u0F7F\\u102B-\\u102C\\u1031\\u1038\\u103B-\\u103C\\u1056-\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083-\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7-\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930-\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8-\\u19C9\\u1A19-\\u1A1A\\u1A55\\u1A57\\u1A61\\u1A63-\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43-\\u1B44\\u1B82\\u1BA1\\u1BA6-\\u1BA7\\u1BAA\\u1BAC-\\u1BAD\\u1BE7\\u1BEA-\\u1BEC\\u1BEE\\u1BF2-\\u1BF3\\u1C24-\\u1C2B\\u1C34-\\u1C35\\u1CE1\\u1CF2-\\u1CF3\\u302E-\\u302F\\uA823-\\uA824\\uA827\\uA880-\\uA881\\uA8B4-\\uA8C3\\uA952-\\uA953\\uA983\\uA9B4-\\uA9B5\\uA9BA-\\uA9BB\\uA9BD-\\uA9C0\\uAA2F-\\uAA30\\uAA33-\\uAA34\\uAA4D\\uAA7B\\uAAEB\\uAAEE-\\uAAEF\\uAAF5\\uABE3-\\uABE4\\uABE6-\\uABE7\\uABE9-\\uABEA\\uABEC]", description: "[\\u0903\\u093B\\u093E-\\u0940\\u0949-\\u094C\\u094E-\\u094F\\u0982-\\u0983\\u09BE-\\u09C0\\u09C7-\\u09C8\\u09CB-\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB-\\u0ACC\\u0B02-\\u0B03\\u0B3E\\u0B40\\u0B47-\\u0B48\\u0B4B-\\u0B4C\\u0B57\\u0BBE-\\u0BBF\\u0BC1-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82-\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7-\\u0CC8\\u0CCA-\\u0CCB\\u0CD5-\\u0CD6\\u0D02-\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82-\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2-\\u0DF3\\u0F3E-\\u0F3F\\u0F7F\\u102B-\\u102C\\u1031\\u1038\\u103B-\\u103C\\u1056-\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083-\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7-\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930-\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8-\\u19C9\\u1A19-\\u1A1A\\u1A55\\u1A57\\u1A61\\u1A63-\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43-\\u1B44\\u1B82\\u1BA1\\u1BA6-\\u1BA7\\u1BAA\\u1BAC-\\u1BAD\\u1BE7\\u1BEA-\\u1BEC\\u1BEE\\u1BF2-\\u1BF3\\u1C24-\\u1C2B\\u1C34-\\u1C35\\u1CE1\\u1CF2-\\u1CF3\\u302E-\\u302F\\uA823-\\uA824\\uA827\\uA880-\\uA881\\uA8B4-\\uA8C3\\uA952-\\uA953\\uA983\\uA9B4-\\uA9B5\\uA9BA-\\uA9BB\\uA9BD-\\uA9C0\\uAA2F-\\uAA30\\uAA33-\\uAA34\\uAA4D\\uAA7B\\uAAEB\\uAAEE-\\uAAEF\\uAAF5\\uABE3-\\uABE4\\uABE6-\\uABE7\\uABE9-\\uABEA\\uABEC]" },
          /^[\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u08FE\u0900-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962-\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2-\u09E3\u0A01-\u0A02\u0A3C\u0A41-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A70-\u0A71\u0A75\u0A81-\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7-\u0AC8\u0ACD\u0AE2-\u0AE3\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62-\u0B63\u0B82\u0BC0\u0BCD\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C62-\u0C63\u0CBC\u0CBF\u0CC6\u0CCC-\u0CCD\u0CE2-\u0CE3\u0D41-\u0D44\u0D4D\u0D62-\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039-\u103A\u103D-\u103E\u1058-\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085-\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17B4-\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u1922\u1927-\u1928\u1932\u1939-\u193B\u1A17-\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80-\u1B81\u1BA2-\u1BA5\u1BA8-\u1BA9\u1BAB\u1BE6\u1BE8-\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1DC0-\u1DE6\u1DFC-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099-\u309A\uA66F\uA674-\uA67D\uA69F\uA6F0-\uA6F1\uA802\uA806\uA80B\uA825-\uA826\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uAA29-\uAA2E\uAA31-\uAA32\uAA35-\uAA36\uAA43\uAA4C\uAAB0\uAAB2-\uAAB4\uAAB7-\uAAB8\uAABE-\uAABF\uAAC1\uAAEC-\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE26]/,
          { type: "class", value: "[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1-\\u05C2\\u05C4-\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7-\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u08E4-\\u08FE\\u0900-\\u0902\\u093A\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0957\\u0962-\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2-\\u09E3\\u0A01-\\u0A02\\u0A3C\\u0A41-\\u0A42\\u0A47-\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70-\\u0A71\\u0A75\\u0A81-\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7-\\u0AC8\\u0ACD\\u0AE2-\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62-\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55-\\u0C56\\u0C62-\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC-\\u0CCD\\u0CE2-\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62-\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB-\\u0EBC\\u0EC8-\\u0ECD\\u0F18-\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86-\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039-\\u103A\\u103D-\\u103E\\u1058-\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085-\\u1086\\u108D\\u109D\\u135D-\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752-\\u1753\\u1772-\\u1773\\u17B4-\\u17B5\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927-\\u1928\\u1932\\u1939-\\u193B\\u1A17-\\u1A18\\u1A1B\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80-\\u1B81\\u1BA2-\\u1BA5\\u1BA8-\\u1BA9\\u1BAB\\u1BE6\\u1BE8-\\u1BE9\\u1BED\\u1BEF-\\u1BF1\\u1C2C-\\u1C33\\u1C36-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1CF4\\u1DC0-\\u1DE6\\u1DFC-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302D\\u3099-\\u309A\\uA66F\\uA674-\\uA67D\\uA69F\\uA6F0-\\uA6F1\\uA802\\uA806\\uA80B\\uA825-\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31-\\uAA32\\uAA35-\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7-\\uAAB8\\uAABE-\\uAABF\\uAAC1\\uAAEC-\\uAAED\\uAAF6\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]", description: "[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1-\\u05C2\\u05C4-\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7-\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0859-\\u085B\\u08E4-\\u08FE\\u0900-\\u0902\\u093A\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0957\\u0962-\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2-\\u09E3\\u0A01-\\u0A02\\u0A3C\\u0A41-\\u0A42\\u0A47-\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70-\\u0A71\\u0A75\\u0A81-\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7-\\u0AC8\\u0ACD\\u0AE2-\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62-\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55-\\u0C56\\u0C62-\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC-\\u0CCD\\u0CE2-\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62-\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB-\\u0EBC\\u0EC8-\\u0ECD\\u0F18-\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86-\\u0F87\\u0F8D-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039-\\u103A\\u103D-\\u103E\\u1058-\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085-\\u1086\\u108D\\u109D\\u135D-\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752-\\u1753\\u1772-\\u1773\\u17B4-\\u17B5\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927-\\u1928\\u1932\\u1939-\\u193B\\u1A17-\\u1A18\\u1A1B\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80-\\u1B81\\u1BA2-\\u1BA5\\u1BA8-\\u1BA9\\u1BAB\\u1BE6\\u1BE8-\\u1BE9\\u1BED\\u1BEF-\\u1BF1\\u1C2C-\\u1C33\\u1C36-\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1CF4\\u1DC0-\\u1DE6\\u1DFC-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2D7F\\u2DE0-\\u2DFF\\u302A-\\u302D\\u3099-\\u309A\\uA66F\\uA674-\\uA67D\\uA69F\\uA6F0-\\uA6F1\\uA802\\uA806\\uA80B\\uA825-\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31-\\uAA32\\uAA35-\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7-\\uAAB8\\uAABE-\\uAABF\\uAAC1\\uAAEC-\\uAAED\\uAAF6\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]" },
          /^[0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]/,
          { type: "class", value: "[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]", description: "[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]" },
          /^[\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF]/,
          { type: "class", value: "[\\u16EE-\\u16F0\\u2160-\\u2182\\u2185-\\u2188\\u3007\\u3021-\\u3029\\u3038-\\u303A\\uA6E6-\\uA6EF]", description: "[\\u16EE-\\u16F0\\u2160-\\u2182\\u2185-\\u2188\\u3007\\u3021-\\u3029\\u3038-\\u303A\\uA6E6-\\uA6EF]" },
          /^[_\u203F-\u2040\u2054\uFE33-\uFE34\uFE4D-\uFE4F\uFF3F]/,
          { type: "class", value: "[\\u005F\\u203F-\\u2040\\u2054\\uFE33-\\uFE34\\uFE4D-\\uFE4F\\uFF3F]", description: "[\\u005F\\u203F-\\u2040\\u2054\\uFE33-\\uFE34\\uFE4D-\\uFE4F\\uFF3F]" },
          /^[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
          { type: "class", value: "[\\u0020\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]", description: "[\\u0020\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]" },
          "break",
          { type: "literal", value: "break", description: "\"break\"" },
          "case",
          { type: "literal", value: "case", description: "\"case\"" },
          "catch",
          { type: "literal", value: "catch", description: "\"catch\"" },
          "class",
          { type: "literal", value: "class", description: "\"class\"" },
          "const",
          { type: "literal", value: "const", description: "\"const\"" },
          "continue",
          { type: "literal", value: "continue", description: "\"continue\"" },
          "debugger",
          { type: "literal", value: "debugger", description: "\"debugger\"" },
          "default",
          { type: "literal", value: "default", description: "\"default\"" },
          "delete",
          { type: "literal", value: "delete", description: "\"delete\"" },
          "do",
          { type: "literal", value: "do", description: "\"do\"" },
          "else",
          { type: "literal", value: "else", description: "\"else\"" },
          "enum",
          { type: "literal", value: "enum", description: "\"enum\"" },
          "export",
          { type: "literal", value: "export", description: "\"export\"" },
          "extends",
          { type: "literal", value: "extends", description: "\"extends\"" },
          "false",
          { type: "literal", value: "false", description: "\"false\"" },
          "finally",
          { type: "literal", value: "finally", description: "\"finally\"" },
          "for",
          { type: "literal", value: "for", description: "\"for\"" },
          "function",
          { type: "literal", value: "function", description: "\"function\"" },
          "get",
          { type: "literal", value: "get", description: "\"get\"" },
          "if",
          { type: "literal", value: "if", description: "\"if\"" },
          "import",
          { type: "literal", value: "import", description: "\"import\"" },
          "instanceof",
          { type: "literal", value: "instanceof", description: "\"instanceof\"" },
          "in",
          { type: "literal", value: "in", description: "\"in\"" },
          "new",
          { type: "literal", value: "new", description: "\"new\"" },
          "null",
          { type: "literal", value: "null", description: "\"null\"" },
          "return",
          { type: "literal", value: "return", description: "\"return\"" },
          "set",
          { type: "literal", value: "set", description: "\"set\"" },
          "super",
          { type: "literal", value: "super", description: "\"super\"" },
          "switch",
          { type: "literal", value: "switch", description: "\"switch\"" },
          "this",
          { type: "literal", value: "this", description: "\"this\"" },
          "throw",
          { type: "literal", value: "throw", description: "\"throw\"" },
          "true",
          { type: "literal", value: "true", description: "\"true\"" },
          "try",
          { type: "literal", value: "try", description: "\"try\"" },
          "typeof",
          { type: "literal", value: "typeof", description: "\"typeof\"" },
          "var",
          { type: "literal", value: "var", description: "\"var\"" },
          "void",
          { type: "literal", value: "void", description: "\"void\"" },
          "while",
          { type: "literal", value: "while", description: "\"while\"" },
          "with",
          { type: "literal", value: "with", description: "\"with\"" },
          ";",
          { type: "literal", value: ";", description: "\";\"" },
          function() { return { type: "ThisExpression" }; },
          function(expression) { return expression; },
          function(commas) { return filledArray(commas.length + 1, null); },
          function(key, body) {
                return {
                  key:   key,
                  value: {
                    type:   "FunctionExpression",
                    id:     null,
                    params: [],
                    body:   body
                  },
                  kind:  "get"
                };
              },
          function(key, params, body) {
                return {
                  key:   key,
                  value: {
                    type:   "FunctionExpression",
                    id:     null,
                    params: params,
                    body:   body
                  },
                  kind:  "set"
                };
              },
          function(id) { return [id]; },
          function(callee, args) {
                    return { type: "NewExpression", callee: callee, arguments: args };
                  },
          function(first, property) {
                    return { property: property, computed: true };
                  },
          function(first, property) {
                    return { property: property, computed: false };
                  },
          function(first, rest) {
                return buildTree(first, rest, function(result, element) {
                  return {
                    type:     "MemberExpression",
                    object:   result,
                    property: element.property,
                    computed: element.computed
                  };
                });
              },
          function(callee) {
                return { type: "NewExpression", callee: callee, arguments: [] };
              },
          function(callee, args) {
                  return { type: "CallExpression", callee: callee, arguments: args };
                },
          function(first, args) {
                    return { type: "CallExpression", arguments: args };
                  },
          function(first, property) {
                    return {
                      type:     "MemberExpression",
                      property: property,
                      computed: true
                    };
                  },
          function(first, property) {
                    return {
                      type:     "MemberExpression",
                      property: property,
                      computed: false
                    };
                  },
          function(first, rest) {
                return buildTree(first, rest, function(result, element) {
                  element[TYPES_TO_PROPERTY_NAMES[element.type]] = result;

                  return element;
                });
              },
          function(args) {
                return optionalList(extractOptional(args, 0));
              },
          function(argument, operator) {
                return {
                  type:     "UpdateExpression",
                  operator: operator,
                  argument: argument,
                  prefix:   false
                };
              },
          "++",
          { type: "literal", value: "++", description: "\"++\"" },
          "--",
          { type: "literal", value: "--", description: "\"--\"" },
          function(operator, argument) {
                var type = (operator === "++" || operator === "--")
                  ? "UpdateExpression"
                  : "UnaryExpression";

                return {
                  type:     type,
                  operator: operator,
                  argument: argument,
                  prefix:   true
                };
              },
          "+",
          { type: "literal", value: "+", description: "\"+\"" },
          "-",
          { type: "literal", value: "-", description: "\"-\"" },
          "~",
          { type: "literal", value: "~", description: "\"~\"" },
          "!",
          { type: "literal", value: "!", description: "\"!\"" },
          "*",
          { type: "literal", value: "*", description: "\"*\"" },
          "%",
          { type: "literal", value: "%", description: "\"%\"" },
          /^[+=]/,
          { type: "class", value: "[+=]", description: "[+=]" },
          /^[\-=]/,
          { type: "class", value: "[-=]", description: "[-=]" },
          "<<",
          { type: "literal", value: "<<", description: "\"<<\"" },
          ">>>",
          { type: "literal", value: ">>>", description: "\">>>\"" },
          ">>",
          { type: "literal", value: ">>", description: "\">>\"" },
          "<=",
          { type: "literal", value: "<=", description: "\"<=\"" },
          ">=",
          { type: "literal", value: ">=", description: "\">=\"" },
          "<",
          { type: "literal", value: "<", description: "\"<\"" },
          ">",
          { type: "literal", value: ">", description: "\">\"" },
          "===",
          { type: "literal", value: "===", description: "\"===\"" },
          "!==",
          { type: "literal", value: "!==", description: "\"!==\"" },
          "==",
          { type: "literal", value: "==", description: "\"==\"" },
          "!=",
          { type: "literal", value: "!=", description: "\"!=\"" },
          "&",
          { type: "literal", value: "&", description: "\"&\"" },
          /^[&=]/,
          { type: "class", value: "[&=]", description: "[&=]" },
          "^",
          { type: "literal", value: "^", description: "\"^\"" },
          /^[|=]/,
          { type: "class", value: "[|=]", description: "[|=]" },
          "&&",
          { type: "literal", value: "&&", description: "\"&&\"" },
          "||",
          { type: "literal", value: "||", description: "\"||\"" },
          "*=",
          { type: "literal", value: "*=", description: "\"*=\"" },
          "/=",
          { type: "literal", value: "/=", description: "\"/=\"" },
          "%=",
          { type: "literal", value: "%=", description: "\"%=\"" },
          "+=",
          { type: "literal", value: "+=", description: "\"+=\"" },
          "-=",
          { type: "literal", value: "-=", description: "\"-=\"" },
          "<<=",
          { type: "literal", value: "<<=", description: "\"<<=\"" },
          ">>=",
          { type: "literal", value: ">>=", description: "\">>=\"" },
          ">>>=",
          { type: "literal", value: ">>>=", description: "\">>>=\"" },
          "&=",
          { type: "literal", value: "&=", description: "\"&=\"" },
          "^=",
          { type: "literal", value: "^=", description: "\"^=\"" },
          "|=",
          { type: "literal", value: "|=", description: "\"|=\"" },
          function(first, rest) {
                if (rest.length > 0) {
                  return {
                    type: "SequenceExpression",
                    expressions: buildList(first, rest, 3),
                    original: text()
                  };
                }

                var res = first
                res.original = text()
                return res
              },
          function(body) {
                return {
                  type: "BlockStatement",
                  body: optionalList(extractOptional(body, 0))
                };
              },
          function(first, rest) { return buildList(first, rest, 1); },
          function(declarations) {
                return {
                  type:         "VariableDeclaration",
                  declarations: declarations
                };
              },
          function(id, init) {
                return {
                  type: "VariableDeclarator",
                  id:   id,
                  init: extractOptional(init, 1)
                };
              },
          function() { return { type: "EmptyStatement" }; },
          function(expression) {
                return {
                  type:       "ExpressionStatement",
                  expression: expression
                };
              },
          function(test, consequent, alternate) {
                return {
                  type:       "IfStatement",
                  test:       test,
                  consequent: consequent,
                  alternate:  alternate
                };
              },
          function(test, consequent) {
                return {
                  type:       "IfStatement",
                  test:       test,
                  consequent: consequent,
                  alternate:  null
                };
              },
          function(body, test) { return { type: "DoWhileStatement", body: body, test: test }; },
          function(test, body) { return { type: "WhileStatement", test: test, body: body }; },
          function(init, test, update, body) {
                return {
                  type:   "ForStatement",
                  init:   extractOptional(init, 0),
                  test:   extractOptional(test, 0),
                  update: extractOptional(update, 0),
                  body:   body
                };
              },
          function(declarations, test, update, body) {
                return {
                  type:   "ForStatement",
                  init:   {
                    type:         "VariableDeclaration",
                    declarations: declarations
                  },
                  test:   extractOptional(test, 0),
                  update: extractOptional(update, 0),
                  body:   body
                };
              },
          function(left, right, body) {
                return {
                  type:  "ForInStatement",
                  left:  left,
                  right: right,
                  body:  body
                };
              },
          function(declarations, right, body) {
                return {
                  type:  "ForInStatement",
                  left:  {
                    type:         "VariableDeclaration",
                    declarations: declarations
                  },
                  right: right,
                  body:  body
                };
              },
          function() {
                return { type: "ContinueStatement", label: null };
              },
          function(label) {
                return { type: "ContinueStatement", label: label };
              },
          function() {
                return { type: "BreakStatement", label: null };
              },
          function(label) {
                return { type: "BreakStatement", label: label };
              },
          function() {
                return { type: "ReturnStatement", argument: null };
              },
          function(argument) {
                return { type: "ReturnStatement", argument: argument };
              },
          function(object, body) { return { type: "WithStatement", object: object, body: body }; },
          function(discriminant, cases) {
                return {
                  type:         "SwitchStatement",
                  discriminant: discriminant,
                  cases:        cases
                };
              },
          function(clauses) {
                return optionalList(extractOptional(clauses, 0));
              },
          function(before, default_, after) {
                return optionalList(extractOptional(before, 0))
                  .concat(default_)
                  .concat(optionalList(extractOptional(after, 0)));
              },
          function(test, consequent) {
                return {
                  type:       "SwitchCase",
                  test:       test,
                  consequent: optionalList(extractOptional(consequent, 1))
                };
              },
          function(consequent) {
                return {
                  type:       "SwitchCase",
                  test:       null,
                  consequent: optionalList(extractOptional(consequent, 1))
                };
              },
          function(label, body) {
                return { type: "LabeledStatement", label: label, body: body };
              },
          function(argument) {
                return { type: "ThrowStatement", argument: argument };
              },
          function(block, handler, finalizer) {
                return {
                  type:      "TryStatement",
                  block:     block,
                  handler:   handler,
                  finalizer: finalizer
                };
              },
          function(block, handler) {
                return {
                  type:      "TryStatement",
                  block:     block,
                  handler:   handler,
                  finalizer: null
                };
              },
          function(block, finalizer) {
                return {
                  type:      "TryStatement",
                  block:     block,
                  handler:   null,
                  finalizer: finalizer
                };
              },
          function(param, body) {
                return {
                  type:  "CatchClause",
                  param: param,
                  body:  body
                };
              },
          function(block) { return block; },
          function() { return { type: "DebuggerStatement" }; },
          function(id, params, body) {
                return {
                  type:   "FunctionDeclaration",
                  id:     id,
                  params: optionalList(extractOptional(params, 0)),
                  body:   body
                };
              },
          function(id, params, body) {
                return {
                  type:   "FunctionExpression",
                  id:     extractOptional(id, 0),
                  params: optionalList(extractOptional(params, 0)),
                  body:   body,
                  original: text()
                };
              },
          function(body) {
                return {
                  type: "BlockStatement",
                  body: optionalList(body)
                };
              },
          function(body) {
                return {
                  type: "Program",
                  body: optionalList(body)
                };
              },
          function(first, rest) {
                return buildList(first, rest, 1);
              },
          function(r) {
                return r;
              }
        ],

        peg$bytecode = [
          peg$decode("%;\xAB/I#;!.\" &\"/;$;\xAB/2$;\u0106/)$8$: $\"\" )($'#(#'#(\"'#&'#"),
          peg$decode("%;6/L#;\xAB/C$;\"/:$;\xAB/1$;7/($8%:!%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\u0107/' 8!:\"!! ).. &%;\xAB/& 8!:#! )"),
          peg$decode("%;(.\" &\"/2#;$/)$8\":$\"\"! )(\"'#&'#"),
          peg$decode(";%.) &;&.# &;'"),
          peg$decode("%;./b#;\xAB/Y$2%\"\"6%7&/J$;\xAB/A$;4.\" &\"/3$;;/*$8&:'&#%! )(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;./b#;\xAB/Y$2(\"\"6(7)/J$;\xAB/A$;4.\" &\"/3$;;/*$8&:*&#%! )(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;./\x99#;\xAB/\x90$2+\"\"6+7,.) &2-\"\"6-7./u$;\xAB/l$;./c$;\xAB/Z$2(\"\"6(7)/K$;\xAB/B$;4.\" &\"/4$;;/+$8*:/*$)%! )(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;)/I#;\xAB/@$20\"\"6071/1$;\xAB/($8$:2$!#)($'#(#'#(\"'#&'#"),
          peg$decode("%$%%%<20\"\"6071=.##&&!&'#/;#43\"\"5!74/,$;g/#$+#)(#'#(\"'#&'#/\"!&,)/a#0^*%%%<20\"\"6071=.##&&!&'#/;#43\"\"5!74/,$;g/#$+#)(#'#(\"'#&'#/\"!&,)&&&#/' 8!:5!! )"),
          peg$decode("%;\xAB/\xC8#;+/\xBF$$%;\xAB/I#26\"\"6677.\" &\"/5$;\xAB/,$;+/#$+$)($'#(#'#(\"'#&'#0S*%;\xAB/I#26\"\"6677.\" &\"/5$;\xAB/,$;+/#$+$)($'#(#'#(\"'#&'#&/O$;\xAB/F$26\"\"6677.\" &\"/2$;\xAB/)$8&:8&\"$#)(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;1/q#%29\"\"697:/M#;\xAB/D$;,/;$;\xAB/2$2;\"\"6;7</#$+%)(%'#($'#(#'#(\"'#&'#.\" &\"/)$8\":=\"\"! )(\"'#&'#"),
          peg$decode("%;-/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;-/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;-/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;\xE3/' 8!:>!! )"),
          peg$decode("%;//\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;//#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;//#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;1/q#%29\"\"697:/M#;\xAB/D$;2/;$;\xAB/2$2;\"\"6;7</#$+%)(%'#($'#(#'#(\"'#&'#.\" &\"/)$8\":?\"\"! )(\"'#&'#"),
          peg$decode("%;1/q#%29\"\"697:/M#;\xAB/D$;9/;$;\xAB/2$2;\"\"6;7</#$+%)(%'#($'#(#'#(\"'#&'#.\" &\"/)$8\":@\"\"! )(\"'#&'#"),
          peg$decode("%4A\"\"5!7B/E#$4C\"\"5!7D0)*4C\"\"5!7D&/)$8\":E\"\"! )(\"'#&'#"),
          peg$decode("%;3/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;3/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;3/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;?/' 8!:>!! )"),
          peg$decode("%;:/d#;\xAB/[$2F\"\"6F7G/L$%<2F\"\"6F7G=.##&&!&'#/1$;\xAB/($8%:H%!$)(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;6/S#;\xAB/J$%;^/\"!&,)/:$;\xAB/1$;7/($8%:I%!\")(%'#($'#(#'#(\"'#&'#.\xD6 &%;6/L#;\xAB/C$;\u0103/:$;\xAB/1$;7/($8%:J%!\")(%'#($'#(#'#(\"'#&'#.\x9D &%;6/S#;\xAB/J$%;8/\"!&,)/:$;\xAB/1$;7/($8%:K%!\")(%'#($'#(#'#(\"'#&'#.] &%;6/S#;\xAB/J$%;\xE3/\"!&,)/:$;\xAB/1$;7/($8%:L%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("2M\"\"6M7N.) &2O\"\"6O7P"),
          peg$decode("2Q\"\"6Q7R"),
          peg$decode("%29\"\"697:/\x82#;\xAB/y$;\u0104.\" &\"/k$;\xAB/b$2;\"\"6;7</S$;\xAB/J$2S\"\"6S7T/;$;\xAB/2$;\"/)$8):U)\"& )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\xE3/' 8!:V!! )"),
          peg$decode("%;C/' 8!:V!! )"),
          peg$decode("%;</\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;</#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;</#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode(";5.# &;0"),
          peg$decode("%2W\"\"6W7X/a#;\xAB/X$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/7$2Y\"\"6Y7Z/($8$:[$!!)($'#(#'#(\"'#&'#.\xE1 &%2W\"\"6W7X/R#;\xAB/I$;>/@$;\xAB/7$2Y\"\"6Y7Z/($8%:\\%!\")(%'#($'#(#'#(\"'#&'#.\x9C &%2W\"\"6W7X/\x8C#;\xAB/\x83$;>/z$;\xAB/q$26\"\"6677/b$;\xAB/Y$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/8$2Y\"\"6Y7Z/)$8(:](\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/2#;?/)$8\":^\"\"! )(\"'#&'#/\xDF#$%;\xAB/l#26\"\"6677/]$;\xAB/T$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/3$;?/*$8%:_%#'! )(%'#($'#(#'#(\"'#&'#0v*%;\xAB/l#26\"\"6677/]$;\xAB/T$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/3$;?/*$8%:_%#'! )(%'#($'#(#'#(\"'#&'#&/)$8\":`\"\"! )(\"'#&'#"),
          peg$decode(";P./ &;Y.) &;=.# &;@"),
          peg$decode("%2O\"\"6O7P/?#;\xAB/6$2Q\"\"6Q7R/'$8#:a# )(#'#(\"'#&'#.\xBF &%2O\"\"6O7P/R#;\xAB/I$;A/@$;\xAB/7$2Q\"\"6Q7R/($8%:b%!\")(%'#($'#(#'#(\"'#&'#.z &%2O\"\"6O7P/j#;\xAB/a$;A/X$;\xAB/O$26\"\"6677/@$;\xAB/7$2Q\"\"6Q7R/($8':b'!$)(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;B/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;B/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;B/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;\xB6/S#;\xAB/J$2c\"\"6c7d/;$;\xAB/2$;\xE0/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;D/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;D/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;D/#$+$)($'#(#'#(\"'#&'#&/)$8\":f\"\"! )(\"'#&'#"),
          peg$decode(";5.\xB9 &%;\xBD/n#;\xAB/e$2g\"\"6g7h/V$%<2g\"\"6g7h=.##&&!&'#/;$;\xAB/2$;D/)$8&:i&\"% )(&'#(%'#($'#(#'#(\"'#&'#.^ &%;\xBD/N#;\xAB/E$;\xE2/<$;\xAB/3$;D/*$8%:j%#$\" )(%'#($'#(#'#(\"'#&'#.# &;E"),
          peg$decode("%;F/~#;\xAB/u$2k\"\"6k7l/f$;\xAB/]$;D/T$;\xAB/K$2c\"\"6c7d/<$;\xAB/3$;D/*$8):m)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.# &;F"),
          peg$decode("%;G/\x8F#$%;\xAB/D#2n\"\"6n7o/5$;\xAB/,$;G/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#2n\"\"6n7o/5$;\xAB/,$;G/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xD2/\x83#$%;\xAB/>#;\xDA/5$;\xAB/,$;\xD2/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xDA/5$;\xAB/,$;\xD2/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("1\"\"5!7q"),
          peg$decode("<2s\"\"6s7t._ &2u\"\"6u7v.S &2w\"\"6w7x.G &2y\"\"6y7z.; &2{\"\"6{7|./ &2}\"\"6}7~.# &;\x84=.\" 7r"),
          peg$decode("4\"\"5!7\x80"),
          peg$decode("<2\x82\"\"6\x827\x83.M &2\x84\"\"6\x847\x85.A &2\x86\"\"6\x867\x87.5 &2\x88\"\"6\x887\x89.) &2\x8A\"\"6\x8A7\x8B=.\" 7\x81"),
          peg$decode("<;M.# &;O=.\" 7\x8C"),
          peg$decode("%2\x8D\"\"6\x8D7\x8E/\x8C#$%%<2\x8F\"\"6\x8F7\x90=.##&&!&'#/,#;H/#$+\")(\"'#&'#0H*%%<2\x8F\"\"6\x8F7\x90=.##&&!&'#/,#;H/#$+\")(\"'#&'#&/2$2\x8F\"\"6\x8F7\x90/#$+#)(#'#(\"'#&'#"),
          peg$decode("%2\x8D\"\"6\x8D7\x8E/\x98#$%%<2\x8F\"\"6\x8F7\x90.# &;J=.##&&!&'#/,#;H/#$+\")(\"'#&'#0N*%%<2\x8F\"\"6\x8F7\x90.# &;J=.##&&!&'#/,#;H/#$+\")(\"'#&'#&/2$2\x8F\"\"6\x8F7\x90/#$+#)(#'#(\"'#&'#"),
          peg$decode("%2\x91\"\"6\x917\x92/q#$%%<;J=.##&&!&'#/,#;H/#$+\")(\"'#&'#0B*%%<;J=.##&&!&'#/,#;H/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
          peg$decode("%%<;V=.##&&!&'#/1#;Q/($8\":\x93\"! )(\"'#&'#"),
          peg$decode("<%;R/9#$;S0#*;S&/)$8\":\x95\"\"! )(\"'#&'#=.\" 7\x94"),
          peg$decode(";T.Y &2\x96\"\"6\x967\x97.M &2\x98\"\"6\x987\x99.A &%2+\"\"6+7,/1#;p/($8\":\x9A\"! )(\"'#&'#"),
          peg$decode(";R.G &;U.A &;\x81.; &;\x83.5 &2\x9B\"\"6\x9B7\x9C.) &2\x9D\"\"6\x9D7\x9E"),
          peg$decode(";~.; &;z.5 &;}./ &;{.) &;|.# &;\x82"),
          peg$decode(";\x80.# &;"),
          peg$decode(";W./ &;X.) &;Z.# &;["),
          peg$decode(";\x85.\xB3 &;\x86.\xAD &;\x87.\xA7 &;\x8A.\xA1 &;\x8B.\x9B &;\x8C.\x95 &;\x8D.\x8F &;\x8E.\x89 &;\x8F.\x83 &;\x94.} &;\x95.w &;\x96.q &;\x98.k &;\x9A.e &;\x9B._ &;\x9C.Y &;\x9E.S &;\xA1.M &;\xA2.G &;\xA3.A &;\xA5.; &;\xA6.5 &;\xA7./ &;\xA8.) &;\xA9.# &;\xAA"),
          peg$decode(";\x88.A &;\x89.; &;\x90.5 &;\x91./ &;\x92.) &;\x99.# &;\xA0"),
          peg$decode(";Z.5 &;[./ &;\\.) &;f.# &;q"),
          peg$decode("%;\x9D/& 8!:\x9F! )"),
          peg$decode("%;\xA4/& 8!:\xA0! ).. &%;\x93/& 8!:\xA1! )"),
          peg$decode("<%;d/C#%<;R.# &;_=.##&&!&'#/($8\":\xA3\"!!)(\"'#&'#.M &%;]/C#%<;R.# &;_=.##&&!&'#/($8\":\xA3\"!!)(\"'#&'#=.\" 7\xA2"),
          peg$decode("%;^/T#2\xA4\"\"6\xA47\xA5/E$$;_0#*;_&/5$;a.\" &\"/'$8$:\xA6$ )($'#(#'#(\"'#&'#.} &%2\xA4\"\"6\xA47\xA5/K#$;_/&#0#*;_&&&#/5$;a.\" &\"/'$8#:\xA6# )(#'#(\"'#&'#.? &%;^/5#;a.\" &\"/'$8\":\xA6\" )(\"'#&'#"),
          peg$decode("2\xA7\"\"6\xA77\xA8.= &%;`/3#$;_0#*;_&/#$+\")(\"'#&'#"),
          peg$decode("4\xA9\"\"5!7\xAA"),
          peg$decode("4\xAB\"\"5!7\xAC"),
          peg$decode("%;b/,#;c/#$+\")(\"'#&'#"),
          peg$decode("3\xAD\"\"5!7\xAE"),
          peg$decode("%4\xAF\"\"5!7\xB0.\" &\"/9#$;_/&#0#*;_&&&#/#$+\")(\"'#&'#"),
          peg$decode("%3\xB1\"\"5\"7\xB2/E#%$;e/&#0#*;e&&&#/\"!&,)/($8\":\xB3\"! )(\"'#&'#"),
          peg$decode("4\xB4\"\"5!7\xB5"),
          peg$decode("<%2\xB7\"\"6\xB77\xB8/G#$;g0#*;g&/7$2\xB7\"\"6\xB77\xB8/($8#:\xB9#!!)(#'#(\"'#&'#.W &%2\xBA\"\"6\xBA7\xBB/G#$;h0#*;h&/7$2\xBA\"\"6\xBA7\xBB/($8#:\xB9#!!)(#'#(\"'#&'#=.\" 7\xB6"),
          peg$decode("%%<2\xB7\"\"6\xB77\xB8./ &2+\"\"6+7,.# &;J=.##&&!&'#/0#;H/'$8\":\xBC\" )(\"'#&'#.G &%2+\"\"6+7,/1#;j/($8\":\x9A\"! )(\"'#&'#.# &;i"),
          peg$decode("%%<2\xBA\"\"6\xBA7\xBB./ &2+\"\"6+7,.# &;J=.##&&!&'#/0#;H/'$8\":\xBC\" )(\"'#&'#.G &%2+\"\"6+7,/1#;j/($8\":\x9A\"! )(\"'#&'#.# &;i"),
          peg$decode("%2+\"\"6+7,/0#;K/'$8\":\xBD\" )(\"'#&'#"),
          peg$decode(";k.X &%2\xA7\"\"6\xA77\xA8/<#%<;_=.##&&!&'#/'$8\":\xBE\" )(\"'#&'#.) &;o.# &;p"),
          peg$decode(";l.# &;m"),
          peg$decode("2\xBA\"\"6\xBA7\xBB.\xBF &2\xB7\"\"6\xB77\xB8.\xB3 &2+\"\"6+7,.\xA7 &%2\xBF\"\"6\xBF7\xC0/& 8!:\xC1! ).\x90 &%2\xC2\"\"6\xC27\xC3/& 8!:\xC4! ).y &%2\xC5\"\"6\xC57\xC6/& 8!:\xC7! ).b &%2\xC8\"\"6\xC87\xC9/& 8!:\xCA! ).K &%2\xCB\"\"6\xCB7\xCC/& 8!:\xCD! ).4 &%2\xCE\"\"6\xCE7\xCF/& 8!:\xD0! )"),
          peg$decode("%%<;n.# &;J=.##&&!&'#/0#;H/'$8\":\xBC\" )(\"'#&'#"),
          peg$decode(";l.; &;_.5 &2\xD1\"\"6\xD17\xD2.) &2\xD3\"\"6\xD37\xD4"),
          peg$decode("%2\xD1\"\"6\xD17\xD2/K#%%;e/,#;e/#$+\")(\"'#&'#/\"!&,)/($8\":\xD5\"! )(\"'#&'#"),
          peg$decode("%2\xD3\"\"6\xD37\xD4/]#%%;e/>#;e/5$;e/,$;e/#$+$)($'#(#'#(\"'#&'#/\"!&,)/($8\":\xD5\"! )(\"'#&'#"),
          peg$decode("<%2-\"\"6-7./X#%;r/\"!&,)/H$2-\"\"6-7./9$%;y/\"!&,)/)$8$:\xD7$\"\" )($'#(#'#(\"'#&'#=.\" 7\xD6"),
          peg$decode("%;s/3#$;t0#*;t&/#$+\")(\"'#&'#"),
          peg$decode("%%<4\xD8\"\"5!7\xD9=.##&&!&'#/,#;v/#$+\")(\"'#&'#.) &;u.# &;w"),
          peg$decode("%%<4\xDA\"\"5!7\xDB=.##&&!&'#/,#;v/#$+\")(\"'#&'#.) &;u.# &;w"),
          peg$decode("%2+\"\"6+7,/,#;v/#$+\")(\"'#&'#"),
          peg$decode("%%<;J=.##&&!&'#/,#;H/#$+\")(\"'#&'#"),
          peg$decode("%2W\"\"6W7X/B#$;x0#*;x&/2$2Y\"\"6Y7Z/#$+#)(#'#(\"'#&'#"),
          peg$decode("%%<4\xDC\"\"5!7\xDD=.##&&!&'#/,#;v/#$+\")(\"'#&'#.# &;u"),
          peg$decode("$;S0#*;S&"),
          peg$decode("4\xDE\"\"5!7\xDF"),
          peg$decode("4\xE0\"\"5!7\xE1"),
          peg$decode("4\xE2\"\"5!7\xE3"),
          peg$decode("4\xE4\"\"5!7\xE5"),
          peg$decode("4\xE6\"\"5!7\xE7"),
          peg$decode("4\xE8\"\"5!7\xE9"),
          peg$decode("4\xEA\"\"5!7\xEB"),
          peg$decode("4\xEC\"\"5!7\xED"),
          peg$decode("4\xEE\"\"5!7\xEF"),
          peg$decode("4\xF0\"\"5!7\xF1"),
          peg$decode("4\xF2\"\"5!7\xF3"),
          peg$decode("%2\xF4\"\"6\xF47\xF5/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\xF6\"\"6\xF67\xF7/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\xF8\"\"6\xF87\xF9/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\xFA\"\"6\xFA7\xFB/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\xFC\"\"6\xFC7\xFD/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\xFE\"\"6\xFE7\xFF/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0100\"\"6\u01007\u0101/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0102\"\"6\u01027\u0103/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0104\"\"6\u01047\u0105/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0106\"\"6\u01067\u0107/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0108\"\"6\u01087\u0109/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u010A\"\"6\u010A7\u010B/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u010C\"\"6\u010C7\u010D/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u010E\"\"6\u010E7\u010F/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0110\"\"6\u01107\u0111/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0112\"\"6\u01127\u0113/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0114\"\"6\u01147\u0115/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0116\"\"6\u01167\u0117/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0118\"\"6\u01187\u0119/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u011A\"\"6\u011A7\u011B/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u011C\"\"6\u011C7\u011D/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u011E\"\"6\u011E7\u011F/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0120\"\"6\u01207\u0121/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0122\"\"6\u01227\u0123/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0124\"\"6\u01247\u0125/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0126\"\"6\u01267\u0127/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0128\"\"6\u01287\u0129/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u012A\"\"6\u012A7\u012B/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u012C\"\"6\u012C7\u012D/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u012E\"\"6\u012E7\u012F/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0130\"\"6\u01307\u0131/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0132\"\"6\u01327\u0133/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0134\"\"6\u01347\u0135/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0136\"\"6\u01367\u0137/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u0138\"\"6\u01387\u0139/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u013A\"\"6\u013A7\u013B/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u013C\"\"6\u013C7\u013D/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("%2\u013E\"\"6\u013E7\u013F/8#%<;S=.##&&!&'#/#$+\")(\"'#&'#"),
          peg$decode("$;I.) &;K.# &;L0/*;I.) &;K.# &;L&"),
          peg$decode("$;I.# &;N0)*;I.# &;N&"),
          peg$decode("%;\xAB/2#2\u0140\"\"6\u01407\u0141/#$+\")(\"'#&'#.\x88 &%;\xAC/:#;O.\" &\"/,$;K/#$+#)(#'#(\"'#&'#.a &%;\xAC/>#%<2Q\"\"6Q7R=/##&'!&&#/#$+\")(\"'#&'#.6 &%;\xAB/,#;\xAE/#$+\")(\"'#&'#"),
          peg$decode("%<1\"\"5!7q=.##&&!&'#"),
          peg$decode("%;\xA2/& 8!:\u0142! ).z &;P.t &;Y.n &;\xB0.h &;\xB3.b &%29\"\"697:/R#;\xAB/I$;\xE3/@$;\xAB/7$2;\"\"6;7</($8%:\u0143%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2W\"\"6W7X/a#;\xAB/X$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/7$2Y\"\"6Y7Z/($8$:[$!!)($'#(#'#(\"'#&'#.\xE1 &%2W\"\"6W7X/R#;\xAB/I$;\xB1/@$;\xAB/7$2Y\"\"6Y7Z/($8%:\\%!\")(%'#($'#(#'#(\"'#&'#.\x9C &%2W\"\"6W7X/\x8C#;\xAB/\x83$;\xB1/z$;\xAB/q$26\"\"6677/b$;\xAB/Y$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/8$2Y\"\"6Y7Z/)$8(:](\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/2#;\xE0/)$8\":^\"\"! )(\"'#&'#/\xDF#$%;\xAB/l#26\"\"6677/]$;\xAB/T$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/3$;\xE0/*$8%:_%#'! )(%'#($'#(#'#(\"'#&'#0v*%;\xAB/l#26\"\"6677/]$;\xAB/T$%;\xB2/,#;\xAB/#$+\")(\"'#&'#.\" &\"/3$;\xE0/*$8%:_%#'! )(%'#($'#(#'#(\"'#&'#&/)$8\":`\"\"! )(\"'#&'#"),
          peg$decode("%26\"\"6677/j#$%;\xAB/2#26\"\"6677/#$+\")(\"'#&'#0<*%;\xAB/2#26\"\"6677/#$+\")(\"'#&'#&/($8\":\u0144\"! )(\"'#&'#"),
          peg$decode("%2O\"\"6O7P/?#;\xAB/6$2Q\"\"6Q7R/'$8#:a# )(#'#(\"'#&'#.\xBF &%2O\"\"6O7P/R#;\xAB/I$;\xB4/@$;\xAB/7$2Q\"\"6Q7R/($8%:b%!\")(%'#($'#(#'#(\"'#&'#.z &%2O\"\"6O7P/j#;\xAB/a$;\xB4/X$;\xAB/O$26\"\"6677/@$;\xAB/7$2Q\"\"6Q7R/($8':b'!$)(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\xB5/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xB5/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xB5/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;\xB6/S#;\xAB/J$2c\"\"6c7d/;$;\xAB/2$;\xE0/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#.\u0164 &%;\x97/\xAD#;\xAB/\xA4$;\xB6/\x9B$;\xAB/\x92$29\"\"697:/\x83$;\xAB/z$2;\"\"6;7</k$;\xAB/b$2O\"\"6O7P/S$;\xAB/J$;\u0105/A$;\xAB/8$2Q\"\"6Q7R/)$8-:\u0145-\"*\")(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\xCA &%;\x9F/\xC0#;\xAB/\xB7$;\xB6/\xAE$;\xAB/\xA5$29\"\"697:/\x96$;\xAB/\x8D$;\xB7/\x84$;\xAB/{$2;\"\"6;7</l$;\xAB/c$2O\"\"6O7P/T$;\xAB/K$;\u0105/B$;\xAB/9$2Q\"\"6Q7R/*$8/:\u0146/#,(\")(/'#(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode(";Q.) &;f.# &;\\"),
          peg$decode("%;P/' 8!:\u0147!! )"),
          peg$decode("%;\xAF.] &;\u0103.W &%;\x9C/M#;\xAB/D$;\xB8/;$;\xAB/2$;\xBB/)$8%:\u0148%\"\" )(%'#($'#(#'#(\"'#&'#/\u0139#$%;\xAB/b#2W\"\"6W7X/S$;\xAB/J$;\xE3/A$;\xAB/8$2Y\"\"6Y7Z/)$8&:\u0149&\"(\")(&'#(%'#($'#(#'#(\"'#&'#.T &%;\xAB/J#2\xA4\"\"6\xA47\xA5/;$;\xAB/2$;Q/)$8$:\u014A$\"& )($'#(#'#(\"'#&'#0\xA3*%;\xAB/b#2W\"\"6W7X/S$;\xAB/J$;\xE3/A$;\xAB/8$2Y\"\"6Y7Z/)$8&:\u0149&\"(\")(&'#(%'#($'#(#'#(\"'#&'#.T &%;\xAB/J#2\xA4\"\"6\xA47\xA5/;$;\xAB/2$;Q/)$8$:\u014A$\"& )($'#(#'#(\"'#&'#&/)$8\":\u014B\"\"! )(\"'#&'#"),
          peg$decode(";\xB8.D &%;\x9C/:#;\xAB/1$;\xB9/($8#:\u014C#! )(#'#(\"'#&'#"),
          peg$decode("%%;\xB8/;#;\xAB/2$;\xBB/)$8#:\u014D#\"\" )(#'#(\"'#&'#/\u0177#$%;\xAB/2#;\xBB/)$8\":\u014E\"\"$ )(\"'#&'#.\xA3 &%;\xAB/b#2W\"\"6W7X/S$;\xAB/J$;\xE3/A$;\xAB/8$2Y\"\"6Y7Z/)$8&:\u014F&\"(\")(&'#(%'#($'#(#'#(\"'#&'#.T &%;\xAB/J#2\xA4\"\"6\xA47\xA5/;$;\xAB/2$;Q/)$8$:\u0150$\"& )($'#(#'#(\"'#&'#0\xC2*%;\xAB/2#;\xBB/)$8\":\u014E\"\"$ )(\"'#&'#.\xA3 &%;\xAB/b#2W\"\"6W7X/S$;\xAB/J$;\xE3/A$;\xAB/8$2Y\"\"6Y7Z/)$8&:\u014F&\"(\")(&'#(%'#($'#(#'#(\"'#&'#.T &%;\xAB/J#2\xA4\"\"6\xA47\xA5/;$;\xAB/2$;Q/)$8$:\u0150$\"& )($'#(#'#(\"'#&'#&/)$8\":\u0151\"\"! )(\"'#&'#"),
          peg$decode("%29\"\"697:/a#;\xAB/X$%;\xBC/,#;\xAB/#$+\")(\"'#&'#.\" &\"/7$2;\"\"6;7</($8$:\u0152$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\xE0/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE0/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE0/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode(";\xBA.# &;\xB9"),
          peg$decode("%;\xBD/;#;\xAC/2$;\xBF/)$8#:\u0153#\"\" )(#'#(\"'#&'#.# &;\xBD"),
          peg$decode("2\u0154\"\"6\u01547\u0155.) &2\u0156\"\"6\u01567\u0157"),
          peg$decode(";\xBE.E &%;\xC1/;#;\xAB/2$;\xC0/)$8#:\u0158#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;\x8D/\"!&,).\xD7 &%;\xA8/\"!&,).\xCA &%;\xA6/\"!&,).\xBD &2\u0154\"\"6\u01547\u0155.\xB1 &2\u0156\"\"6\u01567\u0157.\xA5 &%%2\u0159\"\"6\u01597\u015A/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).m &%%2\u015B\"\"6\u015B7\u015C/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).5 &2\u015D\"\"6\u015D7\u015E.) &2\u015F\"\"6\u015F7\u0160"),
          peg$decode("%;\xC0/\x83#$%;\xAB/>#;\xC3/5$;\xAB/,$;\xC0/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xC3/5$;\xAB/,$;\xC0/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2\u0161\"\"6\u01617\u0162/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).\x8D &%%2-\"\"6-7./>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).U &%%2\u0163\"\"6\u01637\u0164/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xC2/\x83#$%;\xAB/>#;\xC5/5$;\xAB/,$;\xC2/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xC5/5$;\xAB/,$;\xC2/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2\u0159\"\"6\u01597\u015A/>#%<4\u0165\"\"5!7\u0166=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).U &%%2\u015B\"\"6\u015B7\u015C/>#%<4\u0167\"\"5!7\u0168=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xC4/\x83#$%;\xAB/>#;\xC7/5$;\xAB/,$;\xC4/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xC7/5$;\xAB/,$;\xC4/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2\u0169\"\"6\u01697\u016A/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).\x8D &%%2\u016B\"\"6\u016B7\u016C/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).U &%%2\u016D\"\"6\u016D7\u016E/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xC6/\x83#$%;\xAB/>#;\xC9/5$;\xAB/,$;\xC6/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xC9/5$;\xAB/,$;\xC6/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("2\u016F\"\"6\u016F7\u0170.\xB3 &2\u0171\"\"6\u01717\u0172.\xA7 &%%2\u0173\"\"6\u01737\u0174/>#%<2\u0173\"\"6\u01737\u0174=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).o &%%2\u0175\"\"6\u01757\u0176/>#%<2\u0175\"\"6\u01757\u0176=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).7 &%;\x9A/\"!&,).* &%;\x9B/\"!&,)"),
          peg$decode("%;\xC6/\x83#$%;\xAB/>#;\xCB/5$;\xAB/,$;\xC6/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xCB/5$;\xAB/,$;\xC6/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("2\u016F\"\"6\u016F7\u0170.\xA6 &2\u0171\"\"6\u01717\u0172.\x9A &%%2\u0173\"\"6\u01737\u0174/>#%<2\u0173\"\"6\u01737\u0174=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).b &%%2\u0175\"\"6\u01757\u0176/>#%<2\u0175\"\"6\u01757\u0176=.##&&!&'#/#$+\")(\"'#&'#/\"!&,).* &%;\x9A/\"!&,)"),
          peg$decode("%;\xC8/\x83#$%;\xAB/>#;\xCE/5$;\xAB/,$;\xC8/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xCE/5$;\xAB/,$;\xC8/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xCA/\x83#$%;\xAB/>#;\xCE/5$;\xAB/,$;\xCA/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xCE/5$;\xAB/,$;\xCA/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("2\u0177\"\"6\u01777\u0178.A &2\u0179\"\"6\u01797\u017A.5 &2\u017B\"\"6\u017B7\u017C.) &2\u017D\"\"6\u017D7\u017E"),
          peg$decode("%;\xCC/\x83#$%;\xAB/>#;\xD1/5$;\xAB/,$;\xCC/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD1/5$;\xAB/,$;\xCC/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xCD/\x83#$%;\xAB/>#;\xD1/5$;\xAB/,$;\xCD/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD1/5$;\xAB/,$;\xCD/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2\u017F\"\"6\u017F7\u0180/>#%<4\u0181\"\"5!7\u0182=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xCF/\x83#$%;\xAB/>#;\xD4/5$;\xAB/,$;\xCF/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD4/5$;\xAB/,$;\xCF/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xD0/\x83#$%;\xAB/>#;\xD4/5$;\xAB/,$;\xD0/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD4/5$;\xAB/,$;\xD0/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2\u0183\"\"6\u01837\u0184/>#%<2g\"\"6g7h=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xD2/\x83#$%;\xAB/>#;\xD7/5$;\xAB/,$;\xD2/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD7/5$;\xAB/,$;\xD2/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xD3/\x83#$%;\xAB/>#;\xD7/5$;\xAB/,$;\xD3/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xD7/5$;\xAB/,$;\xD3/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%%2F\"\"6F7G/>#%<4\u0185\"\"5!7\u0186=.##&&!&'#/#$+\")(\"'#&'#/\"!&,)"),
          peg$decode("%;\xD5/\x83#$%;\xAB/>#;\xDA/5$;\xAB/,$;\xD5/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xDA/5$;\xAB/,$;\xD5/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xD6/\x83#$%;\xAB/>#;\xDA/5$;\xAB/,$;\xD6/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xDA/5$;\xAB/,$;\xD6/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("2\u0187\"\"6\u01877\u0188"),
          peg$decode("%;\xD8/\x83#$%;\xAB/>#;\xDD/5$;\xAB/,$;\xD8/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xDD/5$;\xAB/,$;\xD8/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("%;\xD9/\x83#$%;\xAB/>#;\xDD/5$;\xAB/,$;\xD9/#$+$)($'#(#'#(\"'#&'#0H*%;\xAB/>#;\xDD/5$;\xAB/,$;\xD9/#$+$)($'#(#'#(\"'#&'#&/)$8\":p\"\"! )(\"'#&'#"),
          peg$decode("2\u0189\"\"6\u01897\u018A"),
          peg$decode("%;\xDB/~#;\xAB/u$2k\"\"6k7l/f$;\xAB/]$;\xE0/T$;\xAB/K$2c\"\"6c7d/<$;\xAB/3$;\xE0/*$8):m)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.# &;\xDB"),
          peg$decode("%;\xDC/~#;\xAB/u$2k\"\"6k7l/f$;\xAB/]$;\xE0/T$;\xAB/K$2c\"\"6c7d/<$;\xAB/3$;\xE1/*$8):m)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.# &;\xDC"),
          peg$decode("%;\xBD/n#;\xAB/e$2g\"\"6g7h/V$%<2g\"\"6g7h=.##&&!&'#/;$;\xAB/2$;\xE0/)$8&:i&\"% )(&'#(%'#($'#(#'#(\"'#&'#.^ &%;\xBD/N#;\xAB/E$;\xE2/<$;\xAB/3$;\xE0/*$8%:j%#$\" )(%'#($'#(#'#(\"'#&'#.# &;\xDE"),
          peg$decode("%;\xBD/n#;\xAB/e$2g\"\"6g7h/V$%<2g\"\"6g7h=.##&&!&'#/;$;\xAB/2$;\xE1/)$8&:i&\"% )(&'#(%'#($'#(#'#(\"'#&'#.^ &%;\xBD/N#;\xAB/E$;\xE2/<$;\xAB/3$;\xE1/*$8%:j%#$\" )(%'#($'#(#'#(\"'#&'#.# &;\xDF"),
          peg$decode("2\u018B\"\"6\u018B7\u018C.\x95 &2\u018D\"\"6\u018D7\u018E.\x89 &2\u018F\"\"6\u018F7\u0190.} &2\u0191\"\"6\u01917\u0192.q &2\u0193\"\"6\u01937\u0194.e &2\u0195\"\"6\u01957\u0196.Y &2\u0197\"\"6\u01977\u0198.M &2\u0199\"\"6\u01997\u019A.A &2\u019B\"\"6\u019B7\u019C.5 &2\u019D\"\"6\u019D7\u019E.) &2\u019F\"\"6\u019F7\u01A0"),
          peg$decode("%;\xE0/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE0/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE0/#$+$)($'#(#'#(\"'#&'#&/)$8\":\u01A1\"\"! )(\"'#&'#"),
          peg$decode("%;\xE1/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE1/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xE1/#$+$)($'#(#'#(\"'#&'#&/)$8\":f\"\"! )(\"'#&'#"),
          peg$decode(";\xE6.q &;\xE8.k &;\xEF.e &;\xF0._ &;\xF1.Y &;\xF2.S &;\xF3.M &;\xF4.G &;\xF5.A &;\xF6.; &;\xFC.5 &;\xF7./ &;\xFD.) &;\xFE.# &;\u0101"),
          peg$decode("%2O\"\"6O7P/a#;\xAB/X$%;\xE7/,#;\xAB/#$+\")(\"'#&'#.\" &\"/7$2Q\"\"6Q7R/($8$:\u01A2$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\xE5/_#$%;\xAB/,#;\xE5/#$+\")(\"'#&'#06*%;\xAB/,#;\xE5/#$+\")(\"'#&'#&/)$8\":\u01A3\"\"! )(\"'#&'#"),
          peg$decode("%;\xA7/C#;\xAB/:$;\xE9/1$;\xAD/($8$:\u01A4$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\xEB/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xEB/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xEB/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;\xEC/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xEC/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;\xEC/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;P/J#%;\xAB/,#;\xED/#$+\")(\"'#&'#.\" &\"/)$8\":\u01A5\"\"! )(\"'#&'#"),
          peg$decode("%;P/J#%;\xAB/,#;\xEE/#$+\")(\"'#&'#.\" &\"/)$8\":\u01A5\"\"! )(\"'#&'#"),
          peg$decode("%2g\"\"6g7h/U#%<2g\"\"6g7h=.##&&!&'#/:$;\xAB/1$;\xE0/($8$:\u0143$! )($'#(#'#(\"'#&'#"),
          peg$decode("%2g\"\"6g7h/U#%<2g\"\"6g7h=.##&&!&'#/:$;\xAB/1$;\xE1/($8$:\u0143$! )($'#(#'#(\"'#&'#"),
          peg$decode("%2\u0140\"\"6\u01407\u0141/& 8!:\u01A6! )"),
          peg$decode("%%<2O\"\"6O7P.# &;\x96=.##&&!&'#/:#;\xE3/1$;\xAD/($8#:\u01A7#!!)(#'#(\"'#&'#"),
          peg$decode("%;\x98/\xA2#;\xAB/\x99$29\"\"697:/\x8A$;\xAB/\x81$;\xE3/x$;\xAB/o$2;\"\"6;7</`$;\xAB/W$;\xE5/N$;\xAB/E$;\x8F/<$;\xAB/3$;\xE5/*$8-:\u01A8-#($ )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\x87 &%;\x98/}#;\xAB/t$29\"\"697:/e$;\xAB/\\$;\xE3/S$;\xAB/J$2;\"\"6;7</;$;\xAB/2$;\xE5/)$8):\u01A9)\"$ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x8E/\x98#;\xAB/\x8F$;\xE5/\x86$;\xAB/}$;\xA9/t$;\xAB/k$29\"\"697:/\\$;\xAB/S$;\xE3/J$;\xAB/A$2;\"\"6;7</2$;\xAD/)$8,:\u01AA,\")#)(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0394 &%;\xA9/}#;\xAB/t$29\"\"697:/e$;\xAB/\\$;\xE3/S$;\xAB/J$2;\"\"6;7</;$;\xAB/2$;\xE5/)$8):\u01AB)\"$ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u032A &%;\x95/\u0100#;\xAB/\xF7$29\"\"697:/\xE8$;\xAB/\xDF$%;\xE4/,#;\xAB/#$+\")(\"'#&'#.\" &\"/\xBE$2\u0140\"\"6\u01407\u0141/\xAF$;\xAB/\xA6$%;\xE3/,#;\xAB/#$+\")(\"'#&'#.\" &\"/\x85$2\u0140\"\"6\u01407\u0141/v$;\xAB/m$%;\xE3/,#;\xAB/#$+\")(\"'#&'#.\" &\"/L$2;\"\"6;7</=$;\xAB/4$;\xE5/+$8.:\u01AC.$)&# )(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u023D &%;\x95/\u0103#;\xAB/\xFA$29\"\"697:/\xEB$;\xAB/\xE2$;\xA7/\xD9$;\xAB/\xD0$;\xEA/\xC7$;\xAB/\xBE$2\u0140\"\"6\u01407\u0141/\xAF$;\xAB/\xA6$%;\xE3/,#;\xAB/#$+\")(\"'#&'#.\" &\"/\x85$2\u0140\"\"6\u01407\u0141/v$;\xAB/m$%;\xE3/,#;\xAB/#$+\")(\"'#&'#.\" &\"/L$2;\"\"6;7</=$;\xAB/4$;\xE5/+$81:\u01AD1$*&# )(1'#(0'#(/'#(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u014D &%;\x95/\xA2#;\xAB/\x99$29\"\"697:/\x8A$;\xAB/\x81$;\xBD/x$;\xAB/o$;\x9B/f$;\xAB/]$;\xE3/T$;\xAB/K$2;\"\"6;7</<$;\xAB/3$;\xE5/*$8-:\u01AE-#($ )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\xBE &%;\x95/\xB4#;\xAB/\xAB$29\"\"697:/\x9C$;\xAB/\x93$;\xA7/\x8A$;\xAB/\x81$;\xEA/x$;\xAB/o$;\x9B/f$;\xAB/]$;\xE3/T$;\xAB/K$2;\"\"6;7</<$;\xAB/3$;\xE5/*$8/:\u01AF/#($ )(/'#(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x8A/0#;\xAD/'$8\":\u01B0\" )(\"'#&'#.M &%;\x8A/C#;\xAC/:$;P/1$;\xAD/($8$:\u01B1$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\x85/0#;\xAD/'$8\":\u01B2\" )(\"'#&'#.M &%;\x85/C#;\xAC/:$;P/1$;\xAD/($8$:\u01B3$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\x9E/0#;\xAD/'$8\":\u01B4\" )(\"'#&'#.M &%;\x9E/C#;\xAC/:$;\xE3/1$;\xAD/($8$:\u01B5$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\xAA/}#;\xAB/t$29\"\"697:/e$;\xAB/\\$;\xE3/S$;\xAB/J$2;\"\"6;7</;$;\xAB/2$;\xE5/)$8):\u01B6)\"$ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\xA1/}#;\xAB/t$29\"\"697:/e$;\xAB/\\$;\xE3/S$;\xAB/J$2;\"\"6;7</;$;\xAB/2$;\xF8/)$8):\u01B7)\"$ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2O\"\"6O7P/a#;\xAB/X$%;\xF9/,#;\xAB/#$+\")(\"'#&'#.\" &\"/7$2Q\"\"6Q7R/($8$:\u01B8$!!)($'#(#'#(\"'#&'#.\xA6 &%2O\"\"6O7P/\x96#;\xAB/\x8D$%;\xF9/,#;\xAB/#$+\")(\"'#&'#.\" &\"/l$;\xFB/c$;\xAB/Z$%;\xF9/,#;\xAB/#$+\")(\"'#&'#.\" &\"/9$2Q\"\"6Q7R/*$8':\u01B9'#$#!)(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\xFA/_#$%;\xAB/,#;\xFA/#$+\")(\"'#&'#06*%;\xAB/,#;\xFA/#$+\")(\"'#&'#&/)$8\":\u01A3\"\"! )(\"'#&'#"),
          peg$decode("%;\x86/t#;\xAB/k$;\xE3/b$;\xAB/Y$2c\"\"6c7d/J$%;\xAB/,#;\xE7/#$+\")(\"'#&'#.\" &\"/)$8&:\u01BA&\"# )(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x8C/a#;\xAB/X$2c\"\"6c7d/I$%;\xAB/,#;\xE7/#$+\")(\"'#&'#.\" &\"/($8$:\u01BB$! )($'#(#'#(\"'#&'#"),
          peg$decode("%;P/S#;\xAB/J$2c\"\"6c7d/;$;\xAB/2$;\xE5/)$8%:\u01BC%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\xA3/C#;\xAC/:$;\xE3/1$;\xAD/($8$:\u01BD$!!)($'#(#'#(\"'#&'#"),
          peg$decode("%;\xA5/`#;\xAB/W$;\xE6/N$;\xAB/E$;\xFF/<$;\xAB/3$;\u0100/*$8':\u01BE'#$\" )(''#(&'#(%'#($'#(#'#(\"'#&'#.\x91 &%;\xA5/M#;\xAB/D$;\xE6/;$;\xAB/2$;\xFF/)$8%:\u01BF%\"\" )(%'#($'#(#'#(\"'#&'#.W &%;\xA5/M#;\xAB/D$;\xE6/;$;\xAB/2$;\u0100/)$8%:\u01C0%\"\" )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x87/}#;\xAB/t$29\"\"697:/e$;\xAB/\\$;P/S$;\xAB/J$2;\"\"6;7</;$;\xAB/2$;\xE6/)$8):\u01C1)\"$ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x94/:#;\xAB/1$;\xE6/($8#:\u01C2#! )(#'#(\"'#&'#"),
          peg$decode("%;\x8B/0#;\xAD/'$8\":\u01C3\" )(\"'#&'#"),
          peg$decode("%;\x96/\xCF#;\xAB/\xC6$;P/\xBD$;\xAB/\xB4$29\"\"697:/\xA5$;\xAB/\x9C$%;\u0104/,#;\xAB/#$+\")(\"'#&'#.\" &\"/{$2;\"\"6;7</l$;\xAB/c$2O\"\"6O7P/T$;\xAB/K$;\u0105/B$;\xAB/9$2Q\"\"6Q7R/*$8.:\u01C4.#+'\")(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;\x96/\xDE#;\xAB/\xD5$%;P/,#;\xAB/#$+\")(\"'#&'#.\" &\"/\xB4$29\"\"697:/\xA5$;\xAB/\x9C$%;\u0104/,#;\xAB/#$+\")(\"'#&'#.\" &\"/{$2;\"\"6;7</l$;\xAB/c$2O\"\"6O7P/T$;\xAB/K$;\u0105/B$;\xAB/9$2Q\"\"6Q7R/*$8-:\u01C5-#*'\")(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;P/\x8F#$%;\xAB/D#26\"\"6677/5$;\xAB/,$;P/#$+$)($'#(#'#(\"'#&'#0N*%;\xAB/D#26\"\"6677/5$;\xAB/,$;P/#$+$)($'#(#'#(\"'#&'#&/)$8\":8\"\"! )(\"'#&'#"),
          peg$decode("%;\u0107.\" &\"/' 8!:\u01C6!! )"),
          peg$decode("%;\xAB/?#;\u0109.\" &\"/1$;\xAB/($8#:\u01C7#!!)(#'#(\"'#&'#"),
          peg$decode("%;\u0108/_#$%;\xAB/,#;\u0108/#$+\")(\"'#&'#06*%;\xAB/,#;\u0108/#$+\")(\"'#&'#&/)$8\":\u01C8\"\"! )(\"'#&'#"),
          peg$decode(";\xE5.# &;\u0102"),
          peg$decode("%;\u010A/_#$%;\xAB/,#;\u010A/#$+\")(\"'#&'#06*%;\xAB/,#;\u010A/#$+\")(\"'#&'#&/)$8\":\u01C8\"\"! )(\"'#&'#"),
          peg$decode("%;#/<#2\u0140\"\"6\u01407\u0141.\" &\"/($8\":\u01C9\"!!)(\"'#&'#")
        ],

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(peg$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(peg$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(peg$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), peg$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              peg$savedPos = peg$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              peg$silentFails++;
              ip++;
              break;

            case 29:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      return stack[0];
    }


      function formatRule(desc) {
        desc.constraints = getConstraints(desc);
        desc = headNormalForm(desc);
        desc = addProperties(desc);
        desc = addReplacements(desc);
        return desc;
      }

      function headNormalForm(ruleDescriptor) {
        var variableNames = {};

        function renameParameters(constraint) {
          if (constraint.type !== 'Constraint') {
            return;
          }

          constraint.parameters.forEach(function(parameter) {
            if (parameter.type !== 'Identifier') {
              return;
            }

            var name = parameter.name;
            if (!variableNames[name]) {
              variableNames[name] = true;
              return;
            }

            if (variableNames[name]) {
              // rename
              var i = 0;
              var newName = name+'_'+i;
              while (variableNames[newName]) {
                i++;
                var newName = name+'_'+i;
              }
              parameter.name = newName
              variableNames[newName] = true;

              // add equality to guard
              ruleDescriptor.guard.push({
                "type": "BinaryExpression",
                "operator": "===",
                "left": {
                   "type": "Identifier",
                   "name": name
                },
                "right": {
                   "type": "Identifier",
                   "name": newName
                }
             });
            }
          });
        }

        ruleDescriptor.kept.forEach(renameParameters);
        ruleDescriptor.removed.forEach(renameParameters);

        return ruleDescriptor;
      }

      function getConstraints(ruleDescriptor) {
        var constraints = {};

        function extractConstraints(constraint) {
          if (constraint.type === 'Constraint') {
            constraints[constraint.name+'/'+constraint.parameters.length] = true;
          }
        }

        ruleDescriptor.kept.forEach(extractConstraints);
        ruleDescriptor.removed.forEach(extractConstraints);
        ruleDescriptor.body.forEach(extractConstraints);

        return Object.keys(constraints);
      }

      function addConstraints(program) {
        var constraints = {};

        program.body.forEach(function (body) {
          if (body.type === 'PropagationRule' || body.type === 'SimplificationRule' || body.type === 'SimpagationRule') {
            body.constraints.forEach(function (constraint) {
              constraints[constraint] = true
            })
          }
        })

        program.constraints = Object.keys(constraints)

        return program
      }

      function addProperties(ruleDescriptor) {
        ruleDescriptor.r = ruleDescriptor.kept.length;
        ruleDescriptor.head = ruleDescriptor.kept.concat(ruleDescriptor.removed);

        return ruleDescriptor;
      }

      function addReplacements(ruleDescriptor) {
        ruleDescriptor.replacements = [];

        ['guard', 'body'].forEach(function (location) {
          ruleDescriptor[location].forEach(function (c) {
            if (c.type === 'Replacement') {
              var entry = {
                loc: location
              }

              if (c.hasOwnProperty('num')) {
                entry.num = c.num
              }
              else if (c.hasOwnProperty('original')) {
                entry.original = c.original
              }
              else if (c.hasOwnProperty('expr')) {
                entry.expr = c.expr
              }

              ruleDescriptor.replacements.push(entry)
            }
          })
        })

        return ruleDescriptor;
      }

      /**
       * Rest for JavaScript PEG
       */
      
      var TYPES_TO_PROPERTY_NAMES = {
        CallExpression:   "callee",
        MemberExpression: "object",
      };

      function filledArray(count, value) {
        var result = new Array(count), i;

        for (i = 0; i < count; i++) {
          result[i] = value;
        }

        return result;
      }

      function extractOptional(optional, index) {
        return optional ? optional[index] : null;
      }

      function extractList(list, index) {
        var result = new Array(list.length), i;

        for (i = 0; i < list.length; i++) {
          result[i] = list[i][index];
        }

        return result;
      }

      function buildList(first, rest, index) {
        return [first].concat(extractList(rest, index));
      }

      function buildTree(first, rest, builder) {
        var result = first, i;

        for (i = 0; i < rest.length; i++) {
          result = builder(result, rest[i]);
        }

        return result;
      }

      function buildBinaryExpression(first, rest) {
        return buildTree(first, rest, function(result, element) {
          return {
            type:     "BinaryExpression",
            operator: element[1],
            left:     result,
            right:    element[3]
          };
        });
      }

      function buildLogicalExpression(first, rest) {
        return buildTree(first, rest, function(result, element) {
          return {
            type:     "LogicalExpression",
            operator: element[1],
            left:     result,
            right:    element[3]
          };
        });
      }

      function optionalList(value) {
        return value !== null ? value : [];
      }


    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

},{}],19:[function(require,module,exports){
module.exports = Rule

var uuid = require('uuid').v1

var HeadCompiler = require('./compile/head')

function Rule (ruleObj, opts) {
  if (typeof ruleObj.name === 'undefined') {
    ruleObj.name = '_' + uuid()
  }

  opts = opts || {}
  opts.globalReplacements = opts.replacements || {}
  opts.breakpoints = opts.breakpoints || false

  this.Scope = opts.scope || {}
  this._source = ruleObj

  this.Replacements = {}
  this._setReplacements(opts.globalReplacements)

  this.Name = ruleObj.name

  this.Breakpoints = {
    onTry: undefined
  }

  this._compile(ruleObj)
}

Rule.prototype._compile = function compileRule (ruleObj) {
  var self = this

  var head
  var compiled

  var headCompiler = new HeadCompiler(ruleObj, {
    replacements: self.Replacements,
    scope: self.Scope
  })

  for (var headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
    head = ruleObj.head[headNo]

    compiled = headCompiler.headNo(headNo).map(function (row) {
      return '  ' + row
    }).join('\n')

    this._addConstraintCaller(head.functor, compiled, {
      location: head.location
    })
  }
}

Rule.prototype._addConstraintCaller = function (functor, compiled, data) {
  data = data || {}

  // create a new function with a single parameter "constraint"
  try {
    var compiledFunction = new Function('constraint', 'replacements', compiled) // eslint-disable-line
  } catch (e) {
    console.log('Compiled source:')
    console.log(compiled)
    throw e
  }

  for (var key in data) {
    compiledFunction[key] = data[key]
  }

  if (!this[functor]) {
    this[functor] = []
  }

  this[functor].push(compiledFunction)
}

Rule.prototype._setReplacements = function (globalReplacements) {
  var self = this

  ;['guard', 'body'].forEach(function (location) {
    self._source[location] = self._source[location].map(function (el) {
      if (el.type !== 'Replacement') {
        return el
      }

      var replacementId

      if (el.hasOwnProperty('num')) {
        replacementId = el.num
        if (!globalReplacements[replacementId]) {
          throw new Error('There is no replacement with number ' + replacementId)
        }

        self.Replacements[replacementId] = globalReplacements[replacementId]
        return el
      }

      if (el.hasOwnProperty('expr') && globalReplacements && globalReplacements.length > 0) {
        // attention: this mutates the globalReplacement parameter!
        var replacement = globalReplacements.shift()

        // get free uuid
        replacementId = uuid()
        self.Replacements[replacementId] = replacement

        // adapt source object
        var newElement = {
          type: 'Replacement',
          num: replacementId
        }

        return newElement
      }

      return el
    })
  })
}

Rule.prototype.ForEach = function forEach (callback, thisArg) {
  var self = this

  for (var functor in self) {
    if (!functor.match(/^[a-z]/)) {
      continue
    }

    callback.call(thisArg, self[functor])
  }
}

Rule.prototype.Fire = function fireConstraint (chr, constraint) {
  var self = this
  var replacements = this.Replacements

  return Promise.resolve().then(callback2Promise({
    event: 'rule:try',
    rule: self.Name,
    location: self._source.location,
    constraint: constraint
  }, this.Breakpoints.onTry)).then(function () {
    var occurrences = self[constraint.functor].length - 1

    return self[constraint.functor].reduce(function (promise, occurrence, ix) {
      return promise.then(callback2Promise({
        event: 'rule:try-occurrence',
        rule: self.Name,
        occurrence: occurrences - ix,
        constraint: constraint,
        location: occurrence.location
      }, occurrence.onTry)).then(function () {
        return occurrence.call(chr, constraint, replacements)
      })
    }, Promise.resolve())
  })
}

function callback2Promise () {
  var f = Array.prototype.slice.call(arguments, -1)[0]
  if (!f) {
    return function () {
      return Promise.resolve()
    }
  }

  var self = this
  var data = Array.prototype.slice.call(arguments, 0, -1)
  return function () {
    return new Promise(function (resolve) {
      data.push(resolve)
      f.apply(self, data)
    })
  }
}

},{"./compile/head":11,"uuid":8}],20:[function(require,module,exports){
module.exports = Rules

var dynamicCaller = require('./dynamic-caller')
var Rule = require('./rule')

function Rules (chr) {
  this._chr = chr

  this.Order = []
}

Rules.prototype.Add = function addRule (ruleObj, globalReplacements) {
  var self = this

  var rule = new Rule(ruleObj, {
    replacements: globalReplacements,
    scope: self._chr.Scope
  })
  var ruleName = rule.Name

  if (this.hasOwnProperty(ruleName)) {
    throw new Error('Rule with name "' + ruleName + '" multiple times specified')
  }

  this[ruleName] = rule
  this.Order.push(rule.Name)

  var constraintName
  ruleObj.constraints.forEach(function (functor) {
    // add callers if not present
    constraintName = functor.split('/')[0]
    if (!self._chr[constraintName]) {
      self._chr[constraintName] = dynamicCaller(constraintName).bind(self._chr)
    }

    if (!self._chr[functor]) {
      self._chr.Constraints[functor] = []
    }
  })

  ruleObj.head.forEach(function (constraint) {
    self._chr.Constraints[constraint.functor].push(ruleName)
  })
}

Rules.prototype.Reset = function reset () {
  var self = this
  var chr = this._chr

  var constraintName
  for (var functor in chr.Constraints) {
    constraintName = functor.split('/')[0]
    if (chr.hasOwnProperty(constraintName)) {
      delete chr[constraintName]
    }
  }
  chr.Constraints = {}

  this.ForEach(function (rule) {
    delete self[rule.Name]
  })
  this.Order = []
}

Rules.prototype.ForEach = function forEach (callback, thisArg) {
  var self = this

  this.Order.forEach(function (ruleName) {
    callback.call(thisArg, self[ruleName])
  })
}

Rules.prototype.SetBreakpoints = function setBreakpoints (f) {
  this.ForEach(function (rule) {
    rule.Breakpoints.onTry = f

    rule.ForEach(function (occurrences) {
      occurrences.forEach(function (occurrence) {
        occurrence.onTry = f
      })
    })
  })
}

Rules.prototype.RemoveBreakpoints = function removeBreakpoints (f) {
  this.SetBreakpoints(undefined)
}

},{"./dynamic-caller":14,"./rule":19}],21:[function(require,module,exports){
module.exports = Store

var util = require('util')
var events = require('events')

var Table = require('easy-table')

function Store () {
  this._lastId = 0
  this._store = {}
  this._index = {}
  this.length = 0

  this.invalid = false
}

util.inherits(Store, events.EventEmitter)

Store.prototype.reset = function reset () {
  this._lastId = 0
  this._store = {}
  this._index = {}
  this.length = 0

  this.invalid = false
}

/**
 * Add a new Constraint in the Constraint Store.
 * @param  {Constraint} constraint
 * @return {Id}         ID of the stored Constraint
 */
Store.prototype.store = Store.prototype.add = function add (constraint) {
  var id = this._getNewConstraintId()
  constraint.id = id
  this._store[id] = constraint
  this._addToIndex(constraint)
  this.length += 1

  this.emit('add', constraint)

  return id
}

Store.prototype.kill = function kill (id) {
  var constraint = this._store[id]
  if (!constraint) {
    return
  }

  constraint.alive = false
  delete this._store[id]
  delete this._index[constraint.name][constraint.arity][constraint.id]
  this.length -= 1

  this.emit('remove', constraint)
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

Store.prototype.allAlive = function allAlive (arr) {
  return arr.every(this.alive.bind(this))
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

Store.prototype.forEach = function (cb) {
  for (var id in this._store) {
    cb(this._store[id], id)
  }
}

Store.prototype.map = function (callback, thisArg) {
  var res = []
  for (var id in this._store) {
    res.push(callback.call(thisArg, this._store[id], id, this))
  }
  return res
}

Store.prototype.toString = function () {
  if (this.length === 0) {
    return '(empty)'
  }

  var t = new Table()

  this.forEach(function (constraint) {
    t.cell('ID', constraint.id)
    t.cell('Constraint', constraint.toString())
    t.newRow()
  })

  return t.toString()
}

},{"easy-table":6,"events":1,"util":5}]},{},[16])(16)
});