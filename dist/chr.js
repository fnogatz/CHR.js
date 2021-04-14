(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CHR = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = () => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, 'g');
};

},{}],2:[function(require,module,exports){

/**
 * Array#filter.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Object=} self
 * @return {Array}
 * @throw TypeError
 */

module.exports = function (arr, fn, self) {
  if (arr.filter) return arr.filter(fn, self);
  if (void 0 === arr || null === arr) throw new TypeError;
  if ('function' != typeof fn) throw new TypeError;
  var ret = [];
  for (var i = 0; i < arr.length; i++) {
    if (!hasOwn.call(arr, i)) continue;
    var val = arr[i];
    if (fn.call(self, val, i, arr)) ret.push(val);
  }
  return ret;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],3:[function(require,module,exports){
(function (global){(function (){
'use strict';

var filter = require('array-filter');

module.exports = function availableTypedArrays() {
	return filter([
		'BigInt64Array',
		'BigUint64Array',
		'Float32Array',
		'Float64Array',
		'Int16Array',
		'Int32Array',
		'Int8Array',
		'Uint16Array',
		'Uint32Array',
		'Uint8Array',
		'Uint8ClampedArray'
	], function (typedArray) {
		return typeof global[typedArray] === 'function';
	});
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"array-filter":2}],4:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],5:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":4,"buffer":5,"ieee754":20}],6:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":7,"get-intrinsic":16}],7:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":15,"get-intrinsic":16}],8:[function(require,module,exports){
(function (Buffer){(function (){
var clone = (function() {
'use strict';

/**
 * Clones (copies) an Object using deep copying.
 *
 * This function supports circular references by default, but if you are certain
 * there are no circular references in your object, you can save some CPU time
 * by calling clone(obj, false).
 *
 * Caution: if `circular` is false and `parent` contains circular references,
 * your program may enter an infinite loop and crash.
 *
 * @param `parent` - the object to be cloned
 * @param `circular` - set to true if the object to be cloned may contain
 *    circular references. (optional - true by default)
 * @param `depth` - set to a number if the object is only to be cloned to
 *    a particular depth. (optional - defaults to Infinity)
 * @param `prototype` - sets the prototype to be used when cloning an object.
 *    (optional - defaults to parent prototype).
*/
function clone(parent, circular, depth, prototype) {
  var filter;
  if (typeof circular === 'object') {
    depth = circular.depth;
    prototype = circular.prototype;
    filter = circular.filter;
    circular = circular.circular
  }
  // maintain two arrays for circular references, where corresponding parents
  // and children have the same index
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular == 'undefined')
    circular = true;

  if (typeof depth == 'undefined')
    depth = Infinity;

  // recurse this function so we don't reset allParents and allChildren
  function _clone(parent, depth) {
    // cloning null always returns null
    if (parent === null)
      return null;

    if (depth == 0)
      return parent;

    var child;
    var proto;
    if (typeof parent != 'object') {
      return parent;
    }

    if (clone.__isArray(parent)) {
      child = [];
    } else if (clone.__isRegExp(parent)) {
      child = new RegExp(parent.source, __getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (clone.__isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      if (Buffer.allocUnsafe) {
        // Node.js >= 4.5.0
        child = Buffer.allocUnsafe(parent.length);
      } else {
        // Older Node.js versions
        child = new Buffer(parent.length);
      }
      parent.copy(child);
      return child;
    } else {
      if (typeof prototype == 'undefined') {
        proto = Object.getPrototypeOf(parent);
        child = Object.create(proto);
      }
      else {
        child = Object.create(prototype);
        proto = prototype;
      }
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    for (var i in parent) {
      var attrs;
      if (proto) {
        attrs = Object.getOwnPropertyDescriptor(proto, i);
      }

      if (attrs && attrs.set == null) {
        continue;
      }
      child[i] = _clone(parent[i], depth - 1);
    }

    return child;
  }

  return _clone(parent, depth);
}

/**
 * Simple flat clone using prototype, accepts only objects, usefull for property
 * override on FLAT configuration object (no nested props).
 *
 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
 * works.
 */
clone.clonePrototype = function clonePrototype(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

// private utility functions

function __objToStr(o) {
  return Object.prototype.toString.call(o);
};
clone.__objToStr = __objToStr;

function __isDate(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Date]';
};
clone.__isDate = __isDate;

function __isArray(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Array]';
};
clone.__isArray = __isArray;

function __isRegExp(o) {
  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
};
clone.__isRegExp = __isRegExp;

function __getRegExpFlags(re) {
  var flags = '';
  if (re.global) flags += 'g';
  if (re.ignoreCase) flags += 'i';
  if (re.multiline) flags += 'm';
  return flags;
};
clone.__getRegExpFlags = __getRegExpFlags;

return clone;
})();

if (typeof module === 'object' && module.exports) {
  module.exports = clone;
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":5}],9:[function(require,module,exports){
var clone = require('clone');

module.exports = function(options, defaults) {
  options = options || {};

  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = clone(defaults[key]);
    }
  });

  return options;
};
},{"clone":8}],10:[function(require,module,exports){
var ansiRegex = require('ansi-regex')
var wcwidth

try {
  wcwidth = require('wcwidth')
} catch(e) {}

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
  var s = str.replace(ansiRegex(), '')
  return wcwidth == null ? s.length : wcwidth(s)
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

},{"ansi-regex":1,"wcwidth":45}],11:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":16}],12:[function(require,module,exports){
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

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],13:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],14:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],15:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":14}],16:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":15,"has":19,"has-symbols":17}],17:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":18}],18:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],19:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":15}],20:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],21:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],22:[function(require,module,exports){
'use strict';

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":6}],23:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var generatorFunc = getGeneratorFunc();
var GeneratorFunction = getProto && generatorFunc ? getProto(generatorFunc) : false;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	return getProto && getProto(fn) === GeneratorFunction;
};

},{}],24:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new global[typedArray]();
		if (!(Symbol.toStringTag in arr)) {
			throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
		}
		var proto = getPrototypeOf(arr);
		var descriptor = gOPD(proto, Symbol.toStringTag);
		if (!descriptor) {
			var superProto = getPrototypeOf(proto);
			descriptor = gOPD(superProto, Symbol.toStringTag);
		}
		toStrTags[typedArray] = descriptor.get;
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":3,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":11,"foreach":13,"has-symbols":17}],25:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
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
    var timeout = runTimeout(cleanUpNextTick);
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
    runClearTimeout(timeout);
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
        runTimeout(drainQueue);
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
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],26:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],27:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
isSharedArrayBufferToString.working = (
  typeof SharedArrayBuffer !== 'undefined' &&
  isSharedArrayBufferToString(new SharedArrayBuffer())
);
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBuffer === 'undefined') {
    return false;
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBuffer;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":22,"is-generator-function":23,"is-typed-array":24,"which-typed-array":46}],28:[function(require,module,exports){
(function (process){(function (){
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

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

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
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
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
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
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
exports.types = require('./support/types');

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
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

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

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":26,"./support/types":27,"_process":25,"inherits":21}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "v1", {
  enumerable: true,
  get: function () {
    return _v.default;
  }
});
Object.defineProperty(exports, "v3", {
  enumerable: true,
  get: function () {
    return _v2.default;
  }
});
Object.defineProperty(exports, "v4", {
  enumerable: true,
  get: function () {
    return _v3.default;
  }
});
Object.defineProperty(exports, "v5", {
  enumerable: true,
  get: function () {
    return _v4.default;
  }
});
Object.defineProperty(exports, "NIL", {
  enumerable: true,
  get: function () {
    return _nil.default;
  }
});
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});
Object.defineProperty(exports, "validate", {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, "stringify", {
  enumerable: true,
  get: function () {
    return _stringify.default;
  }
});
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return _parse.default;
  }
});

var _v = _interopRequireDefault(require("./v1.js"));

var _v2 = _interopRequireDefault(require("./v3.js"));

var _v3 = _interopRequireDefault(require("./v4.js"));

var _v4 = _interopRequireDefault(require("./v5.js"));

var _nil = _interopRequireDefault(require("./nil.js"));

var _version = _interopRequireDefault(require("./version.js"));

var _validate = _interopRequireDefault(require("./validate.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./nil.js":31,"./parse.js":32,"./stringify.js":36,"./v1.js":37,"./v3.js":38,"./v4.js":40,"./v5.js":41,"./validate.js":42,"./version.js":43}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (let i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  const output = [];
  const length32 = input.length * 32;
  const hexTab = '0123456789abcdef';

  for (let i = 0; i < length32; i += 8) {
    const x = input[i >> 5] >>> i % 32 & 0xff;
    const hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  const length8 = input.length * 8;
  const output = new Uint32Array(getOutputLength(length8));

  for (let i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var _default = md5;
exports.default = _default;
},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = '00000000-0000-0000-0000-000000000000';
exports.default = _default;
},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  let v;
  const arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

var _default = parse;
exports.default = _default;
},{"./validate.js":42}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
exports.default = _default;
},{}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rng;
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);

function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}
},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    const msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (let i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  const l = bytes.length / 4 + 2;
  const N = Math.ceil(l / 16);
  const M = new Array(N);

  for (let i = 0; i < N; ++i) {
    const arr = new Uint32Array(16);

    for (let j = 0; j < 16; ++j) {
      arr[j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }

    M[i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (let i = 0; i < N; ++i) {
    const W = new Uint32Array(80);

    for (let t = 0; t < 16; ++t) {
      W[t] = M[i][t];
    }

    for (let t = 16; t < 80; ++t) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];

    for (let t = 0; t < 80; ++t) {
      const s = Math.floor(t / 20);
      const T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var _default = sha1;
exports.default = _default;
},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

var _default = stringify;
exports.default = _default;
},{"./validate.js":42}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html
let _nodeId;

let _clockseq; // Previous uuid creation time


let _lastMSecs = 0;
let _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || _rng.default)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  let msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  const tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || (0, _stringify.default)(b);
}

var _default = v1;
exports.default = _default;
},{"./rng.js":34,"./stringify.js":36}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _md = _interopRequireDefault(require("./md5.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v3 = (0, _v.default)('v3', 0x30, _md.default);
var _default = v3;
exports.default = _default;
},{"./md5.js":30,"./v35.js":39}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.URL = exports.DNS = void 0;

var _stringify = _interopRequireDefault(require("./stringify.js"));

var _parse = _interopRequireDefault(require("./parse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

const DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
exports.DNS = DNS;
const URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
exports.URL = URL;

function _default(name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = (0, _parse.default)(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return (0, _stringify.default)(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}
},{"./parse.js":32,"./stringify.js":36}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rng = _interopRequireDefault(require("./rng.js"));

var _stringify = _interopRequireDefault(require("./stringify.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function v4(options, buf, offset) {
  options = options || {};

  const rnds = options.random || (options.rng || _rng.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`


  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0, _stringify.default)(rnds);
}

var _default = v4;
exports.default = _default;
},{"./rng.js":34,"./stringify.js":36}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _v = _interopRequireDefault(require("./v35.js"));

var _sha = _interopRequireDefault(require("./sha1.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const v5 = (0, _v.default)('v5', 0x50, _sha.default);
var _default = v5;
exports.default = _default;
},{"./sha1.js":35,"./v35.js":39}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regex = _interopRequireDefault(require("./regex.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(uuid) {
  return typeof uuid === 'string' && _regex.default.test(uuid);
}

var _default = validate;
exports.default = _default;
},{"./regex.js":33}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _validate = _interopRequireDefault(require("./validate.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function version(uuid) {
  if (!(0, _validate.default)(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

var _default = version;
exports.default = _default;
},{"./validate.js":42}],44:[function(require,module,exports){
module.exports = [
    [ 0x0300, 0x036F ], [ 0x0483, 0x0486 ], [ 0x0488, 0x0489 ],
    [ 0x0591, 0x05BD ], [ 0x05BF, 0x05BF ], [ 0x05C1, 0x05C2 ],
    [ 0x05C4, 0x05C5 ], [ 0x05C7, 0x05C7 ], [ 0x0600, 0x0603 ],
    [ 0x0610, 0x0615 ], [ 0x064B, 0x065E ], [ 0x0670, 0x0670 ],
    [ 0x06D6, 0x06E4 ], [ 0x06E7, 0x06E8 ], [ 0x06EA, 0x06ED ],
    [ 0x070F, 0x070F ], [ 0x0711, 0x0711 ], [ 0x0730, 0x074A ],
    [ 0x07A6, 0x07B0 ], [ 0x07EB, 0x07F3 ], [ 0x0901, 0x0902 ],
    [ 0x093C, 0x093C ], [ 0x0941, 0x0948 ], [ 0x094D, 0x094D ],
    [ 0x0951, 0x0954 ], [ 0x0962, 0x0963 ], [ 0x0981, 0x0981 ],
    [ 0x09BC, 0x09BC ], [ 0x09C1, 0x09C4 ], [ 0x09CD, 0x09CD ],
    [ 0x09E2, 0x09E3 ], [ 0x0A01, 0x0A02 ], [ 0x0A3C, 0x0A3C ],
    [ 0x0A41, 0x0A42 ], [ 0x0A47, 0x0A48 ], [ 0x0A4B, 0x0A4D ],
    [ 0x0A70, 0x0A71 ], [ 0x0A81, 0x0A82 ], [ 0x0ABC, 0x0ABC ],
    [ 0x0AC1, 0x0AC5 ], [ 0x0AC7, 0x0AC8 ], [ 0x0ACD, 0x0ACD ],
    [ 0x0AE2, 0x0AE3 ], [ 0x0B01, 0x0B01 ], [ 0x0B3C, 0x0B3C ],
    [ 0x0B3F, 0x0B3F ], [ 0x0B41, 0x0B43 ], [ 0x0B4D, 0x0B4D ],
    [ 0x0B56, 0x0B56 ], [ 0x0B82, 0x0B82 ], [ 0x0BC0, 0x0BC0 ],
    [ 0x0BCD, 0x0BCD ], [ 0x0C3E, 0x0C40 ], [ 0x0C46, 0x0C48 ],
    [ 0x0C4A, 0x0C4D ], [ 0x0C55, 0x0C56 ], [ 0x0CBC, 0x0CBC ],
    [ 0x0CBF, 0x0CBF ], [ 0x0CC6, 0x0CC6 ], [ 0x0CCC, 0x0CCD ],
    [ 0x0CE2, 0x0CE3 ], [ 0x0D41, 0x0D43 ], [ 0x0D4D, 0x0D4D ],
    [ 0x0DCA, 0x0DCA ], [ 0x0DD2, 0x0DD4 ], [ 0x0DD6, 0x0DD6 ],
    [ 0x0E31, 0x0E31 ], [ 0x0E34, 0x0E3A ], [ 0x0E47, 0x0E4E ],
    [ 0x0EB1, 0x0EB1 ], [ 0x0EB4, 0x0EB9 ], [ 0x0EBB, 0x0EBC ],
    [ 0x0EC8, 0x0ECD ], [ 0x0F18, 0x0F19 ], [ 0x0F35, 0x0F35 ],
    [ 0x0F37, 0x0F37 ], [ 0x0F39, 0x0F39 ], [ 0x0F71, 0x0F7E ],
    [ 0x0F80, 0x0F84 ], [ 0x0F86, 0x0F87 ], [ 0x0F90, 0x0F97 ],
    [ 0x0F99, 0x0FBC ], [ 0x0FC6, 0x0FC6 ], [ 0x102D, 0x1030 ],
    [ 0x1032, 0x1032 ], [ 0x1036, 0x1037 ], [ 0x1039, 0x1039 ],
    [ 0x1058, 0x1059 ], [ 0x1160, 0x11FF ], [ 0x135F, 0x135F ],
    [ 0x1712, 0x1714 ], [ 0x1732, 0x1734 ], [ 0x1752, 0x1753 ],
    [ 0x1772, 0x1773 ], [ 0x17B4, 0x17B5 ], [ 0x17B7, 0x17BD ],
    [ 0x17C6, 0x17C6 ], [ 0x17C9, 0x17D3 ], [ 0x17DD, 0x17DD ],
    [ 0x180B, 0x180D ], [ 0x18A9, 0x18A9 ], [ 0x1920, 0x1922 ],
    [ 0x1927, 0x1928 ], [ 0x1932, 0x1932 ], [ 0x1939, 0x193B ],
    [ 0x1A17, 0x1A18 ], [ 0x1B00, 0x1B03 ], [ 0x1B34, 0x1B34 ],
    [ 0x1B36, 0x1B3A ], [ 0x1B3C, 0x1B3C ], [ 0x1B42, 0x1B42 ],
    [ 0x1B6B, 0x1B73 ], [ 0x1DC0, 0x1DCA ], [ 0x1DFE, 0x1DFF ],
    [ 0x200B, 0x200F ], [ 0x202A, 0x202E ], [ 0x2060, 0x2063 ],
    [ 0x206A, 0x206F ], [ 0x20D0, 0x20EF ], [ 0x302A, 0x302F ],
    [ 0x3099, 0x309A ], [ 0xA806, 0xA806 ], [ 0xA80B, 0xA80B ],
    [ 0xA825, 0xA826 ], [ 0xFB1E, 0xFB1E ], [ 0xFE00, 0xFE0F ],
    [ 0xFE20, 0xFE23 ], [ 0xFEFF, 0xFEFF ], [ 0xFFF9, 0xFFFB ],
    [ 0x10A01, 0x10A03 ], [ 0x10A05, 0x10A06 ], [ 0x10A0C, 0x10A0F ],
    [ 0x10A38, 0x10A3A ], [ 0x10A3F, 0x10A3F ], [ 0x1D167, 0x1D169 ],
    [ 0x1D173, 0x1D182 ], [ 0x1D185, 0x1D18B ], [ 0x1D1AA, 0x1D1AD ],
    [ 0x1D242, 0x1D244 ], [ 0xE0001, 0xE0001 ], [ 0xE0020, 0xE007F ],
    [ 0xE0100, 0xE01EF ]
]

},{}],45:[function(require,module,exports){
"use strict"

var defaults = require('defaults')
var combining = require('./combining')

var DEFAULTS = {
  nul: 0,
  control: 0
}

module.exports = function wcwidth(str) {
  return wcswidth(str, DEFAULTS)
}

module.exports.config = function(opts) {
  opts = defaults(opts || {}, DEFAULTS)
  return function wcwidth(str) {
    return wcswidth(str, opts)
  }
}

/*
 *  The following functions define the column width of an ISO 10646
 *  character as follows:
 *  - The null character (U+0000) has a column width of 0.
 *  - Other C0/C1 control characters and DEL will lead to a return value
 *    of -1.
 *  - Non-spacing and enclosing combining characters (general category
 *    code Mn or Me in the
 *    Unicode database) have a column width of 0.
 *  - SOFT HYPHEN (U+00AD) has a column width of 1.
 *  - Other format characters (general category code Cf in the Unicode
 *    database) and ZERO WIDTH
 *    SPACE (U+200B) have a column width of 0.
 *  - Hangul Jamo medial vowels and final consonants (U+1160-U+11FF)
 *    have a column width of 0.
 *  - Spacing characters in the East Asian Wide (W) or East Asian
 *    Full-width (F) category as
 *    defined in Unicode Technical Report #11 have a column width of 2.
 *  - All remaining characters (including all printable ISO 8859-1 and
 *    WGL4 characters, Unicode control characters, etc.) have a column
 *    width of 1.
 *  This implementation assumes that characters are encoded in ISO 10646.
*/

function wcswidth(str, opts) {
  if (typeof str !== 'string') return wcwidth(str, opts)

  var s = 0
  for (var i = 0; i < str.length; i++) {
    var n = wcwidth(str.charCodeAt(i), opts)
    if (n < 0) return -1
    s += n
  }

  return s
}

function wcwidth(ucs, opts) {
  // test for 8-bit control characters
  if (ucs === 0) return opts.nul
  if (ucs < 32 || (ucs >= 0x7f && ucs < 0xa0)) return opts.control

  // binary search in table of non-spacing characters
  if (bisearch(ucs)) return 0

  // if we arrive here, ucs is not a combining or C0/C1 control character
  return 1 +
      (ucs >= 0x1100 &&
       (ucs <= 0x115f ||                       // Hangul Jamo init. consonants
        ucs == 0x2329 || ucs == 0x232a ||
        (ucs >= 0x2e80 && ucs <= 0xa4cf &&
         ucs != 0x303f) ||                     // CJK ... Yi
        (ucs >= 0xac00 && ucs <= 0xd7a3) ||    // Hangul Syllables
        (ucs >= 0xf900 && ucs <= 0xfaff) ||    // CJK Compatibility Ideographs
        (ucs >= 0xfe10 && ucs <= 0xfe19) ||    // Vertical forms
        (ucs >= 0xfe30 && ucs <= 0xfe6f) ||    // CJK Compatibility Forms
        (ucs >= 0xff00 && ucs <= 0xff60) ||    // Fullwidth Forms
        (ucs >= 0xffe0 && ucs <= 0xffe6) ||
        (ucs >= 0x20000 && ucs <= 0x2fffd) ||
        (ucs >= 0x30000 && ucs <= 0x3fffd)));
}

function bisearch(ucs) {
  var min = 0
  var max = combining.length - 1
  var mid

  if (ucs < combining[0][0] || ucs > combining[max][1]) return false

  while (max >= min) {
    mid = Math.floor((min + max) / 2)
    if (ucs > combining[mid][1]) min = mid + 1
    else if (ucs < combining[mid][0]) max = mid - 1
    else return true
  }

  return false
}

},{"./combining":44,"defaults":9}],46:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasSymbols = require('has-symbols')();
var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof global[typedArray] === 'function') {
			var arr = new global[typedArray]();
			if (!(Symbol.toStringTag in arr)) {
				throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
			}
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":3,"call-bind/callBound":6,"es-abstract/helpers/getOwnPropertyDescriptor":11,"foreach":13,"has-symbols":17,"is-typed-array":24}],47:[function(require,module,exports){
const History = require('./src/history')
const Store = require('./src/store')
const Constraint = require('./src/constraint')
const dynamicCaller = require('./src/dynamic-caller')

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
  const indexes = Array.apply(null, Array(arr.length)).map(Number.prototype.valueOf, 0)
  forEachOnIndex(arr, indexes, iterator, onEnd)
}

function forEachOnIndex (arr, indexes, iterator, onEnd) {
  let iterablePosition = -1
  const values = []
  let value
  let ix

  let disjoint = true
  for (let position = 0; position < indexes.length; position++) {
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
      for (let ix = iterablePosition + 1; ix < indexes.length; ix++) {
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

},{"./src/constraint":51,"./src/dynamic-caller":52,"./src/history":53,"./src/store":59}],48:[function(require,module,exports){
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
      indent(1) + 'var ' + lastParamName + ' = function(e, r) { (e || !r) ? j() : s() }',
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



},{"./util":50}],49:[function(require,module,exports){
module.exports = Compiler

const util = require('./util')
const fakeScope = require('./fake-scope')

const indent = util.indent
const indentBy = util.indentBy
const destructuring = util.destructuring
const escape = util.escape

function Compiler (rule, opts) {
  opts = opts || {}

  this.rule = rule

  this.replacements = opts.replacements || {}
  this.scope = opts.scope || {}

  this.opts = {
    this: opts.this || 'this',
    helper: opts.helper || 'self.Helper',
    defaultCallbackNames: opts.defaultCallbackNames || ['cb', 'callback']
  }
}

Compiler.prototype.headNo = function compileHeadNo (headNo) {
  const self = this
  headNo = headNo || 0
  const rule = this.rule
  const opts = this.opts

  if (!rule.head[headNo]) {
    throw new Error('No constraint with number ' + headNo + ' in this rule head')
  }

  const constraint = rule.head[headNo]
  if (constraint.type !== 'Constraint') {
    throw new Error('No constraint at number ' + headNo)
  }

  let parts = []
  let level = 0

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
    let line = headIndex === 0 ? indent(1) : ', '
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
      parts = parts.concat(destructuring(head, 'self.Store.args(ids[' + headIndex + '])', 'return callback()').map(indentBy(level)))
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
  for (let k = rule.r + 1; k <= rule.head.length; k++) {
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
  const self = this
  let parts = []

  parts.push(
    'var guards = ['
  )

  this.rule.guard.forEach(function (guard, guardIndex) {
    const expr = guardIndex === 0 ? indent(1) : ', '

    if (guard.type === 'Replacement' && typeof guard.num !== 'undefined') {
      // get parameters via dependency injection
      const params = util.getFunctionParameters(self.replacements[guard.num])
      const lastParamName = util.getLastParamName(params)
      parts.push(
        expr + 'new Promise(function (s, j) {',
        indent(2) + 'var ' + lastParamName + ' = function (e, r) { (e || !r) ? j() : s() }',
        indent(2) + 'replacements["' + guard.num + '"].apply(self, [' + params + '])',
        indent(1) + '})'
      )

      return
    }

    if (guard.type === 'Replacement' && typeof guard.expr !== 'undefined') {
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
  const self = this
  const rule = this.rule

  let expr = 'if ('
  const boolExprs = []
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
  const self = this
  let parts = []

  parts.push('Promise.resolve()')

  this.rule.body.forEach(function (body, bodyIndex) {
    if (body.type === 'Constraint' && body.name === 'true' && body.arity === 0) {
      return
    }

    parts.push('.then(function () {')

    if (body.type === 'Constraint') {
      let expr = indent(1) + 'return self.' + body.name + '('
      expr += body.parameters.map(function (parameter) {
        return self.generateExpression(parameter)
      }).join(', ')
      expr += ')'
      parts.push(expr)
      parts.push('})')
      return
    }

    if (body.type === 'Replacement' && typeof body.expr !== 'undefined') {
      parts = parts.concat(fakeScope(self.scope, body.expr.original).map(function (row, rowId) {
        if (rowId === 0) {
          return 'return ' + row
        }
        return indent(1) + row
      }))
      parts.push('})')
      return
    }

    let params
    let lastParamName

    if (body.type === 'Replacement' && typeof body.num !== 'undefined') {
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

    if (body.type === 'Replacement' && typeof body.func !== 'undefined') {
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
  const self = this

  let expr = ''
  if (body.type === 'Constraint') {
    expr += 'self.' + body.name + '('
    expr += body.parameters.map(function (parameter) {
      return self.generateExpression(parameter)
    }).join(', ')
    expr += ')'

    return [expr]
  }

  if (body.type === 'Replacement') {
    if (typeof body.expr !== 'undefined') {
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
  return [expr]
}

Compiler.prototype.generateBinaryExpression = function generateBinaryExpression (expr) {
  const self = this

  return ['left', 'right'].map(function (part) {
    if (expr[part].type === 'Identifier') {
      return expr[part].name
    }
    if (expr[part].type === 'Literal') {
      return escape(expr[part].value)
    }
    if (expr[part].type === 'BinaryExpression') {
      return '(' + self.generateBinaryExpression(expr[part]) + ')'
    }
    return ''
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

},{"./fake-scope":48,"./util":50}],50:[function(require,module,exports){
module.exports = {}
module.exports.indent = indent
module.exports.indentBy = indentBy
module.exports.destructuring = destructuring
module.exports.getFunctionParameters = getFunctionParameters
module.exports.getLastParamName = getLastParamName
module.exports.replaceLastParam = replaceLastParam
module.exports.isArrowFunction = isArrowFunction
module.exports.escape = escape

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

  return Array((level * spaces) + 1).join(' ')
}

function indentBy (level, spaces) {
  return function (str) {
    return indent(level, spaces) + str
  }
}

function destructuring (constraint, to, thenStmt) {
  thenStmt = thenStmt || 'return Promise.resolve()'

  let parts = []
  constraint.parameters.forEach(function (parameter, i) {
    if (parameter.type === 'Literal') {
      parts.push(indent(0) + 'if (' + to + '[' + i + '] !== ' + escape(parameter.value) + ') {')
      if (Array.isArray(thenStmt)) {
        parts = parts.concat(thenStmt.map(indentBy(1)))
      } else {
        parts.push(indent(1) + thenStmt)
      }
      parts.push(indent(0) + '}')
      return
    }

    let name = parameter.name
    if (parameter.type === 'ArrayExpression') {
      parts.push('', '// Note: This feature needs native Destructuring (Array value).')

      name = parameter.original
    } else if (parameter.type === 'ObjectExpression') {
      parts.push('', '// Note: This feature needs native Destructuring (Object value).')

      name = parameter.original
    }

    parts.push('var ' + name + ' = ' + to + '[' + i + ']')
  })
  return parts
}

function getFunctionParameters (func) {
  if (isArrowFunction(func)) {
    return func.toString().match(/^\(\s*([^)]*)\)\s*=>/m)[1]
  } else {
    return func.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m)[1]
  }
}

function getLastParamName (params) {
  return params.replace(/(^.*,|^)\s*([^,]+)$/g, '$2')
}

function replaceLastParam (params, replacement) {
  return params.replace(/((^.*,|^)\s*)([^,]+)$/g, '$1' + replacement)
}

function isArrowFunction (func) {
  return !Object.prototype.hasOwnProperty.call(func, 'prototype')
}

function escape (val) {
  if (typeof val === 'string') {
    return '"' + val + '"'
  }
  if (val === null) {
    return 'null'
  }

  return val
}

},{}],51:[function(require,module,exports){
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
  let res = this.name
  if (this.arity > 0) {
    res += '('
    res += this.args.map(escape).join(',')
    res += ')'
  }
  return res
}

function escape (val) {
  let res = JSON.stringify(val)
  if (typeof res !== 'string') {
    res = '"' + val.toString() + '"'
  }
  return res
}

},{}],52:[function(require,module,exports){
module.exports = dynamicCaller

const Constraint = require('./constraint')

function dynamicCaller (name) {
  return function () {
    const args = Array.prototype.slice.call(arguments)
    const arity = arguments.length
    const functor = name + '/' + arity

    if (typeof this.Constraints[functor] === 'undefined') {
      throw new Error('Constraint ' + functor + ' not defined.')
    }

    const constraint = new Constraint(name, arity, args)
    this.Store.add(constraint)

    const rules = []
    this.Rules.ForEach(function (rule) {
      if (rule[functor]) {
        rules.push(rule)
      }
    })

    const self = this

    return rules.reduce(function (curr, rule) {
      return curr.then(function () {
        return rule.Fire(self, constraint)
      })
    }, Promise.resolve())
  }
}

},{"./constraint":51}],53:[function(require,module,exports){
module.exports = History

function History () {
  this._history = {}
}

History.prototype.add = function add (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    this._history[rule] = []
  }

  const str = hash(ids)
  this._history[rule].push(str)
}

History.prototype.notIn = function notIn (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    return true
  }

  const str = hash(ids)
  const found = (this._history[rule].indexOf(str) >= 0)
  return !found
}

History.prototype.has = function has (rule, ids) {
  if (typeof this._history[rule] === 'undefined') {
    return false
  }

  const str = hash(ids)
  const found = (this._history[rule].indexOf(str) >= 0)
  return found
}

function hash (ids) {
  return ids.join('_')
}

},{}],54:[function(require,module,exports){
;(function () {
  const root = this
  let prevCHR
  if (root && root.CHR) {
    prevCHR = root.CHR
  }

  const Runtime = require('../runtime')
  const Rules = require('./rules')
  const Rule = require('./rule')
  const joinParts = require('./join-parts')

  let parse
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
      let program
      let replacements

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
        const combined = [
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

      const rules = program.body
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

  CHR.version = '3.3.20'

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

},{"../runtime":47,"./join-parts":55,"./parser.peg.js":56,"./rule":57,"./rules":58}],55:[function(require,module,exports){
module.exports = joinParts

function joinParts (arr) {
  let res = arr[0].trim()
  let replacementNo = 0

  arr.forEach(function (el, ix) {
    if (ix === 0) {
      // omit first
      return
    }

    if (typeof el === 'string') {
      const str = el.trim()
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

},{}],56:[function(require,module,exports){
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */

"use strict";

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

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

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
        peg$literalExpectation("==>", false),
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
        peg$literalExpectation("<=>", false),
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
        peg$literalExpectation("\\", false),
        "/",
        peg$literalExpectation("/", false),
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
        peg$literalExpectation("@", false),
        function(identifier) {
              return identifier;
            },
        /^[a-z0-9_]/,
        peg$classExpectation([["a", "z"], ["0", "9"], "_"], false, false),
        function(chars) {
              return chars.join('').trim();
            },
        ",",
        peg$literalExpectation(",", false),
        function(first, rest) {
              return buildList(first, rest, 3);
            },
        "(",
        peg$literalExpectation("(", false),
        ")",
        peg$literalExpectation(")", false),
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
        peg$classExpectation([["a", "z"]], false, false),
        /^[A-z0-9_]/,
        peg$classExpectation([["A", "z"], ["0", "9"], "_"], false, false),
        function(first, following) {
              return first+following.join('');
            },
        "|",
        peg$literalExpectation("|", false),
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
        peg$literalExpectation("${", false),
        "{",
        peg$literalExpectation("{", false),
        "}",
        peg$literalExpectation("}", false),
        "=>",
        peg$literalExpectation("=>", false),
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
        peg$literalExpectation("[", false),
        "]",
        peg$literalExpectation("]", false),
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
        peg$literalExpectation(":", false),
        function(key, value) {
              return { key: key, value: value, kind: "init" };
            },
        function(first, rest) {
              return rest.length > 0
                ? { type: "SequenceExpression", expressions: buildList(first, rest, 3) }
                : first;
            },
        "=",
        peg$literalExpectation("=", false),
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
        peg$literalExpectation("?", false),
        function(test, consequent, alternate) {
              return {
                type:       "ConditionalExpression",
                test:       test,
                consequent: consequent,
                alternate:  alternate
              };
            },
        "LogicalOROperator",
        peg$literalExpectation("LogicalOROperator", false),
        function(first, rest) { return buildBinaryExpression(first, rest); },
        peg$anyExpectation(),
        peg$otherExpectation("whitespace"),
        "\t",
        peg$literalExpectation("\t", false),
        "\x0B",
        peg$literalExpectation("\x0B", false),
        "\f",
        peg$literalExpectation("\f", false),
        " ",
        peg$literalExpectation(" ", false),
        "\xA0",
        peg$literalExpectation("\xA0", false),
        "\uFEFF",
        peg$literalExpectation("\uFEFF", false),
        /^[\n\r\u2028\u2029]/,
        peg$classExpectation(["\n", "\r", "\u2028", "\u2029"], false, false),
        peg$otherExpectation("end of line"),
        "\n",
        peg$literalExpectation("\n", false),
        "\r\n",
        peg$literalExpectation("\r\n", false),
        "\r",
        peg$literalExpectation("\r", false),
        "\u2028",
        peg$literalExpectation("\u2028", false),
        "\u2029",
        peg$literalExpectation("\u2029", false),
        peg$otherExpectation("comment"),
        "/*",
        peg$literalExpectation("/*", false),
        "*/",
        peg$literalExpectation("*/", false),
        "//",
        peg$literalExpectation("//", false),
        function(name) { return name; },
        peg$otherExpectation("identifier"),
        function(first, rest) {
              return {
                type: "Identifier",
                name: first + rest.join("")
              };
            },
        "$",
        peg$literalExpectation("$", false),
        "_",
        peg$literalExpectation("_", false),
        function(sequence) { return sequence; },
        "\u200C",
        peg$literalExpectation("\u200C", false),
        "\u200D",
        peg$literalExpectation("\u200D", false),
        function() { return { type: "Literal", value: null }; },
        function() { return { type: "Literal", value: true  }; },
        function() { return { type: "Literal", value: false }; },
        peg$otherExpectation("number"),
        function(literal) {
              return literal;
            },
        ".",
        peg$literalExpectation(".", false),
        function() {
              return { type: "Literal", value: parseFloat(text()) };
            },
        "0",
        peg$literalExpectation("0", false),
        /^[0-9]/,
        peg$classExpectation([["0", "9"]], false, false),
        /^[1-9]/,
        peg$classExpectation([["1", "9"]], false, false),
        "e",
        peg$literalExpectation("e", true),
        /^[+\-]/,
        peg$classExpectation(["+", "-"], false, false),
        "0x",
        peg$literalExpectation("0x", true),
        function(digits) {
              return { type: "Literal", value: parseInt(digits, 16) };
             },
        /^[0-9a-f]/i,
        peg$classExpectation([["0", "9"], ["a", "f"]], false, true),
        peg$otherExpectation("string"),
        "\"",
        peg$literalExpectation("\"", false),
        function(chars) {
              return { type: "Literal", value: chars.join("") };
            },
        "'",
        peg$literalExpectation("'", false),
        function() { return text(); },
        function() { return ""; },
        function() { return "\0"; },
        "b",
        peg$literalExpectation("b", false),
        function() { return "\b";   },
        "f",
        peg$literalExpectation("f", false),
        function() { return "\f";   },
        "n",
        peg$literalExpectation("n", false),
        function() { return "\n";   },
        "r",
        peg$literalExpectation("r", false),
        function() { return "\r";   },
        "t",
        peg$literalExpectation("t", false),
        function() { return "\t";   },
        "v",
        peg$literalExpectation("v", false),
        function() { return "\x0B"; },
        "x",
        peg$literalExpectation("x", false),
        "u",
        peg$literalExpectation("u", false),
        function(digits) {
              return String.fromCharCode(parseInt(digits, 16));
            },
        peg$otherExpectation("regular expression"),
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
        peg$classExpectation(["*", "\\", "/", "["], false, false),
        /^[\\\/[]/,
        peg$classExpectation(["\\", "/", "["], false, false),
        /^[\]\\]/,
        peg$classExpectation(["]", "\\"], false, false),
        /^[a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137-\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148-\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C-\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA-\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9-\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC-\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF-\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F-\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0-\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB-\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE-\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0561-\u0587\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6-\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FC7\u1FD0-\u1FD3\u1FD6-\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6-\u1FF7\u210A\u210E-\u210F\u2113\u212F\u2134\u2139\u213C-\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65-\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73-\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3-\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7FA\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A]/,
        peg$classExpectation([["a", "z"], "\xB5", ["\xDF", "\xF6"], ["\xF8", "\xFF"], "\u0101", "\u0103", "\u0105", "\u0107", "\u0109", "\u010B", "\u010D", "\u010F", "\u0111", "\u0113", "\u0115", "\u0117", "\u0119", "\u011B", "\u011D", "\u011F", "\u0121", "\u0123", "\u0125", "\u0127", "\u0129", "\u012B", "\u012D", "\u012F", "\u0131", "\u0133", "\u0135", ["\u0137", "\u0138"], "\u013A", "\u013C", "\u013E", "\u0140", "\u0142", "\u0144", "\u0146", ["\u0148", "\u0149"], "\u014B", "\u014D", "\u014F", "\u0151", "\u0153", "\u0155", "\u0157", "\u0159", "\u015B", "\u015D", "\u015F", "\u0161", "\u0163", "\u0165", "\u0167", "\u0169", "\u016B", "\u016D", "\u016F", "\u0171", "\u0173", "\u0175", "\u0177", "\u017A", "\u017C", ["\u017E", "\u0180"], "\u0183", "\u0185", "\u0188", ["\u018C", "\u018D"], "\u0192", "\u0195", ["\u0199", "\u019B"], "\u019E", "\u01A1", "\u01A3", "\u01A5", "\u01A8", ["\u01AA", "\u01AB"], "\u01AD", "\u01B0", "\u01B4", "\u01B6", ["\u01B9", "\u01BA"], ["\u01BD", "\u01BF"], "\u01C6", "\u01C9", "\u01CC", "\u01CE", "\u01D0", "\u01D2", "\u01D4", "\u01D6", "\u01D8", "\u01DA", ["\u01DC", "\u01DD"], "\u01DF", "\u01E1", "\u01E3", "\u01E5", "\u01E7", "\u01E9", "\u01EB", "\u01ED", ["\u01EF", "\u01F0"], "\u01F3", "\u01F5", "\u01F9", "\u01FB", "\u01FD", "\u01FF", "\u0201", "\u0203", "\u0205", "\u0207", "\u0209", "\u020B", "\u020D", "\u020F", "\u0211", "\u0213", "\u0215", "\u0217", "\u0219", "\u021B", "\u021D", "\u021F", "\u0221", "\u0223", "\u0225", "\u0227", "\u0229", "\u022B", "\u022D", "\u022F", "\u0231", ["\u0233", "\u0239"], "\u023C", ["\u023F", "\u0240"], "\u0242", "\u0247", "\u0249", "\u024B", "\u024D", ["\u024F", "\u0293"], ["\u0295", "\u02AF"], "\u0371", "\u0373", "\u0377", ["\u037B", "\u037D"], "\u0390", ["\u03AC", "\u03CE"], ["\u03D0", "\u03D1"], ["\u03D5", "\u03D7"], "\u03D9", "\u03DB", "\u03DD", "\u03DF", "\u03E1", "\u03E3", "\u03E5", "\u03E7", "\u03E9", "\u03EB", "\u03ED", ["\u03EF", "\u03F3"], "\u03F5", "\u03F8", ["\u03FB", "\u03FC"], ["\u0430", "\u045F"], "\u0461", "\u0463", "\u0465", "\u0467", "\u0469", "\u046B", "\u046D", "\u046F", "\u0471", "\u0473", "\u0475", "\u0477", "\u0479", "\u047B", "\u047D", "\u047F", "\u0481", "\u048B", "\u048D", "\u048F", "\u0491", "\u0493", "\u0495", "\u0497", "\u0499", "\u049B", "\u049D", "\u049F", "\u04A1", "\u04A3", "\u04A5", "\u04A7", "\u04A9", "\u04AB", "\u04AD", "\u04AF", "\u04B1", "\u04B3", "\u04B5", "\u04B7", "\u04B9", "\u04BB", "\u04BD", "\u04BF", "\u04C2", "\u04C4", "\u04C6", "\u04C8", "\u04CA", "\u04CC", ["\u04CE", "\u04CF"], "\u04D1", "\u04D3", "\u04D5", "\u04D7", "\u04D9", "\u04DB", "\u04DD", "\u04DF", "\u04E1", "\u04E3", "\u04E5", "\u04E7", "\u04E9", "\u04EB", "\u04ED", "\u04EF", "\u04F1", "\u04F3", "\u04F5", "\u04F7", "\u04F9", "\u04FB", "\u04FD", "\u04FF", "\u0501", "\u0503", "\u0505", "\u0507", "\u0509", "\u050B", "\u050D", "\u050F", "\u0511", "\u0513", "\u0515", "\u0517", "\u0519", "\u051B", "\u051D", "\u051F", "\u0521", "\u0523", "\u0525", "\u0527", ["\u0561", "\u0587"], ["\u1D00", "\u1D2B"], ["\u1D6B", "\u1D77"], ["\u1D79", "\u1D9A"], "\u1E01", "\u1E03", "\u1E05", "\u1E07", "\u1E09", "\u1E0B", "\u1E0D", "\u1E0F", "\u1E11", "\u1E13", "\u1E15", "\u1E17", "\u1E19", "\u1E1B", "\u1E1D", "\u1E1F", "\u1E21", "\u1E23", "\u1E25", "\u1E27", "\u1E29", "\u1E2B", "\u1E2D", "\u1E2F", "\u1E31", "\u1E33", "\u1E35", "\u1E37", "\u1E39", "\u1E3B", "\u1E3D", "\u1E3F", "\u1E41", "\u1E43", "\u1E45", "\u1E47", "\u1E49", "\u1E4B", "\u1E4D", "\u1E4F", "\u1E51", "\u1E53", "\u1E55", "\u1E57", "\u1E59", "\u1E5B", "\u1E5D", "\u1E5F", "\u1E61", "\u1E63", "\u1E65", "\u1E67", "\u1E69", "\u1E6B", "\u1E6D", "\u1E6F", "\u1E71", "\u1E73", "\u1E75", "\u1E77", "\u1E79", "\u1E7B", "\u1E7D", "\u1E7F", "\u1E81", "\u1E83", "\u1E85", "\u1E87", "\u1E89", "\u1E8B", "\u1E8D", "\u1E8F", "\u1E91", "\u1E93", ["\u1E95", "\u1E9D"], "\u1E9F", "\u1EA1", "\u1EA3", "\u1EA5", "\u1EA7", "\u1EA9", "\u1EAB", "\u1EAD", "\u1EAF", "\u1EB1", "\u1EB3", "\u1EB5", "\u1EB7", "\u1EB9", "\u1EBB", "\u1EBD", "\u1EBF", "\u1EC1", "\u1EC3", "\u1EC5", "\u1EC7", "\u1EC9", "\u1ECB", "\u1ECD", "\u1ECF", "\u1ED1", "\u1ED3", "\u1ED5", "\u1ED7", "\u1ED9", "\u1EDB", "\u1EDD", "\u1EDF", "\u1EE1", "\u1EE3", "\u1EE5", "\u1EE7", "\u1EE9", "\u1EEB", "\u1EED", "\u1EEF", "\u1EF1", "\u1EF3", "\u1EF5", "\u1EF7", "\u1EF9", "\u1EFB", "\u1EFD", ["\u1EFF", "\u1F07"], ["\u1F10", "\u1F15"], ["\u1F20", "\u1F27"], ["\u1F30", "\u1F37"], ["\u1F40", "\u1F45"], ["\u1F50", "\u1F57"], ["\u1F60", "\u1F67"], ["\u1F70", "\u1F7D"], ["\u1F80", "\u1F87"], ["\u1F90", "\u1F97"], ["\u1FA0", "\u1FA7"], ["\u1FB0", "\u1FB4"], ["\u1FB6", "\u1FB7"], "\u1FBE", ["\u1FC2", "\u1FC4"], ["\u1FC6", "\u1FC7"], ["\u1FD0", "\u1FD3"], ["\u1FD6", "\u1FD7"], ["\u1FE0", "\u1FE7"], ["\u1FF2", "\u1FF4"], ["\u1FF6", "\u1FF7"], "\u210A", ["\u210E", "\u210F"], "\u2113", "\u212F", "\u2134", "\u2139", ["\u213C", "\u213D"], ["\u2146", "\u2149"], "\u214E", "\u2184", ["\u2C30", "\u2C5E"], "\u2C61", ["\u2C65", "\u2C66"], "\u2C68", "\u2C6A", "\u2C6C", "\u2C71", ["\u2C73", "\u2C74"], ["\u2C76", "\u2C7B"], "\u2C81", "\u2C83", "\u2C85", "\u2C87", "\u2C89", "\u2C8B", "\u2C8D", "\u2C8F", "\u2C91", "\u2C93", "\u2C95", "\u2C97", "\u2C99", "\u2C9B", "\u2C9D", "\u2C9F", "\u2CA1", "\u2CA3", "\u2CA5", "\u2CA7", "\u2CA9", "\u2CAB", "\u2CAD", "\u2CAF", "\u2CB1", "\u2CB3", "\u2CB5", "\u2CB7", "\u2CB9", "\u2CBB", "\u2CBD", "\u2CBF", "\u2CC1", "\u2CC3", "\u2CC5", "\u2CC7", "\u2CC9", "\u2CCB", "\u2CCD", "\u2CCF", "\u2CD1", "\u2CD3", "\u2CD5", "\u2CD7", "\u2CD9", "\u2CDB", "\u2CDD", "\u2CDF", "\u2CE1", ["\u2CE3", "\u2CE4"], "\u2CEC", "\u2CEE", "\u2CF3", ["\u2D00", "\u2D25"], "\u2D27", "\u2D2D", "\uA641", "\uA643", "\uA645", "\uA647", "\uA649", "\uA64B", "\uA64D", "\uA64F", "\uA651", "\uA653", "\uA655", "\uA657", "\uA659", "\uA65B", "\uA65D", "\uA65F", "\uA661", "\uA663", "\uA665", "\uA667", "\uA669", "\uA66B", "\uA66D", "\uA681", "\uA683", "\uA685", "\uA687", "\uA689", "\uA68B", "\uA68D", "\uA68F", "\uA691", "\uA693", "\uA695", "\uA697", "\uA723", "\uA725", "\uA727", "\uA729", "\uA72B", "\uA72D", ["\uA72F", "\uA731"], "\uA733", "\uA735", "\uA737", "\uA739", "\uA73B", "\uA73D", "\uA73F", "\uA741", "\uA743", "\uA745", "\uA747", "\uA749", "\uA74B", "\uA74D", "\uA74F", "\uA751", "\uA753", "\uA755", "\uA757", "\uA759", "\uA75B", "\uA75D", "\uA75F", "\uA761", "\uA763", "\uA765", "\uA767", "\uA769", "\uA76B", "\uA76D", "\uA76F", ["\uA771", "\uA778"], "\uA77A", "\uA77C", "\uA77F", "\uA781", "\uA783", "\uA785", "\uA787", "\uA78C", "\uA78E", "\uA791", "\uA793", "\uA7A1", "\uA7A3", "\uA7A5", "\uA7A7", "\uA7A9", "\uA7FA", ["\uFB00", "\uFB06"], ["\uFB13", "\uFB17"], ["\uFF41", "\uFF5A"]], false, false),
        /^[\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5-\u06E6\u07F4-\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C-\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D-\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA717-\uA71F\uA770\uA788\uA7F8-\uA7F9\uA9CF\uAA70\uAADD\uAAF3-\uAAF4\uFF70\uFF9E-\uFF9F]/,
        peg$classExpectation([["\u02B0", "\u02C1"], ["\u02C6", "\u02D1"], ["\u02E0", "\u02E4"], "\u02EC", "\u02EE", "\u0374", "\u037A", "\u0559", "\u0640", ["\u06E5", "\u06E6"], ["\u07F4", "\u07F5"], "\u07FA", "\u081A", "\u0824", "\u0828", "\u0971", "\u0E46", "\u0EC6", "\u10FC", "\u17D7", "\u1843", "\u1AA7", ["\u1C78", "\u1C7D"], ["\u1D2C", "\u1D6A"], "\u1D78", ["\u1D9B", "\u1DBF"], "\u2071", "\u207F", ["\u2090", "\u209C"], ["\u2C7C", "\u2C7D"], "\u2D6F", "\u2E2F", "\u3005", ["\u3031", "\u3035"], "\u303B", ["\u309D", "\u309E"], ["\u30FC", "\u30FE"], "\uA015", ["\uA4F8", "\uA4FD"], "\uA60C", "\uA67F", ["\uA717", "\uA71F"], "\uA770", "\uA788", ["\uA7F8", "\uA7F9"], "\uA9CF", "\uAA70", "\uAADD", ["\uAAF3", "\uAAF4"], "\uFF70", ["\uFF9E", "\uFF9F"]], false, false),
        /^[\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05F0-\u05F2\u0620-\u063F\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0977\u0979-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10D0-\u10FA\u10FD-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A-\uA62B\uA66E\uA6A0-\uA6E5\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        peg$classExpectation(["\xAA", "\xBA", "\u01BB", ["\u01C0", "\u01C3"], "\u0294", ["\u05D0", "\u05EA"], ["\u05F0", "\u05F2"], ["\u0620", "\u063F"], ["\u0641", "\u064A"], ["\u066E", "\u066F"], ["\u0671", "\u06D3"], "\u06D5", ["\u06EE", "\u06EF"], ["\u06FA", "\u06FC"], "\u06FF", "\u0710", ["\u0712", "\u072F"], ["\u074D", "\u07A5"], "\u07B1", ["\u07CA", "\u07EA"], ["\u0800", "\u0815"], ["\u0840", "\u0858"], "\u08A0", ["\u08A2", "\u08AC"], ["\u0904", "\u0939"], "\u093D", "\u0950", ["\u0958", "\u0961"], ["\u0972", "\u0977"], ["\u0979", "\u097F"], ["\u0985", "\u098C"], ["\u098F", "\u0990"], ["\u0993", "\u09A8"], ["\u09AA", "\u09B0"], "\u09B2", ["\u09B6", "\u09B9"], "\u09BD", "\u09CE", ["\u09DC", "\u09DD"], ["\u09DF", "\u09E1"], ["\u09F0", "\u09F1"], ["\u0A05", "\u0A0A"], ["\u0A0F", "\u0A10"], ["\u0A13", "\u0A28"], ["\u0A2A", "\u0A30"], ["\u0A32", "\u0A33"], ["\u0A35", "\u0A36"], ["\u0A38", "\u0A39"], ["\u0A59", "\u0A5C"], "\u0A5E", ["\u0A72", "\u0A74"], ["\u0A85", "\u0A8D"], ["\u0A8F", "\u0A91"], ["\u0A93", "\u0AA8"], ["\u0AAA", "\u0AB0"], ["\u0AB2", "\u0AB3"], ["\u0AB5", "\u0AB9"], "\u0ABD", "\u0AD0", ["\u0AE0", "\u0AE1"], ["\u0B05", "\u0B0C"], ["\u0B0F", "\u0B10"], ["\u0B13", "\u0B28"], ["\u0B2A", "\u0B30"], ["\u0B32", "\u0B33"], ["\u0B35", "\u0B39"], "\u0B3D", ["\u0B5C", "\u0B5D"], ["\u0B5F", "\u0B61"], "\u0B71", "\u0B83", ["\u0B85", "\u0B8A"], ["\u0B8E", "\u0B90"], ["\u0B92", "\u0B95"], ["\u0B99", "\u0B9A"], "\u0B9C", ["\u0B9E", "\u0B9F"], ["\u0BA3", "\u0BA4"], ["\u0BA8", "\u0BAA"], ["\u0BAE", "\u0BB9"], "\u0BD0", ["\u0C05", "\u0C0C"], ["\u0C0E", "\u0C10"], ["\u0C12", "\u0C28"], ["\u0C2A", "\u0C33"], ["\u0C35", "\u0C39"], "\u0C3D", ["\u0C58", "\u0C59"], ["\u0C60", "\u0C61"], ["\u0C85", "\u0C8C"], ["\u0C8E", "\u0C90"], ["\u0C92", "\u0CA8"], ["\u0CAA", "\u0CB3"], ["\u0CB5", "\u0CB9"], "\u0CBD", "\u0CDE", ["\u0CE0", "\u0CE1"], ["\u0CF1", "\u0CF2"], ["\u0D05", "\u0D0C"], ["\u0D0E", "\u0D10"], ["\u0D12", "\u0D3A"], "\u0D3D", "\u0D4E", ["\u0D60", "\u0D61"], ["\u0D7A", "\u0D7F"], ["\u0D85", "\u0D96"], ["\u0D9A", "\u0DB1"], ["\u0DB3", "\u0DBB"], "\u0DBD", ["\u0DC0", "\u0DC6"], ["\u0E01", "\u0E30"], ["\u0E32", "\u0E33"], ["\u0E40", "\u0E45"], ["\u0E81", "\u0E82"], "\u0E84", ["\u0E87", "\u0E88"], "\u0E8A", "\u0E8D", ["\u0E94", "\u0E97"], ["\u0E99", "\u0E9F"], ["\u0EA1", "\u0EA3"], "\u0EA5", "\u0EA7", ["\u0EAA", "\u0EAB"], ["\u0EAD", "\u0EB0"], ["\u0EB2", "\u0EB3"], "\u0EBD", ["\u0EC0", "\u0EC4"], ["\u0EDC", "\u0EDF"], "\u0F00", ["\u0F40", "\u0F47"], ["\u0F49", "\u0F6C"], ["\u0F88", "\u0F8C"], ["\u1000", "\u102A"], "\u103F", ["\u1050", "\u1055"], ["\u105A", "\u105D"], "\u1061", ["\u1065", "\u1066"], ["\u106E", "\u1070"], ["\u1075", "\u1081"], "\u108E", ["\u10D0", "\u10FA"], ["\u10FD", "\u1248"], ["\u124A", "\u124D"], ["\u1250", "\u1256"], "\u1258", ["\u125A", "\u125D"], ["\u1260", "\u1288"], ["\u128A", "\u128D"], ["\u1290", "\u12B0"], ["\u12B2", "\u12B5"], ["\u12B8", "\u12BE"], "\u12C0", ["\u12C2", "\u12C5"], ["\u12C8", "\u12D6"], ["\u12D8", "\u1310"], ["\u1312", "\u1315"], ["\u1318", "\u135A"], ["\u1380", "\u138F"], ["\u13A0", "\u13F4"], ["\u1401", "\u166C"], ["\u166F", "\u167F"], ["\u1681", "\u169A"], ["\u16A0", "\u16EA"], ["\u1700", "\u170C"], ["\u170E", "\u1711"], ["\u1720", "\u1731"], ["\u1740", "\u1751"], ["\u1760", "\u176C"], ["\u176E", "\u1770"], ["\u1780", "\u17B3"], "\u17DC", ["\u1820", "\u1842"], ["\u1844", "\u1877"], ["\u1880", "\u18A8"], "\u18AA", ["\u18B0", "\u18F5"], ["\u1900", "\u191C"], ["\u1950", "\u196D"], ["\u1970", "\u1974"], ["\u1980", "\u19AB"], ["\u19C1", "\u19C7"], ["\u1A00", "\u1A16"], ["\u1A20", "\u1A54"], ["\u1B05", "\u1B33"], ["\u1B45", "\u1B4B"], ["\u1B83", "\u1BA0"], ["\u1BAE", "\u1BAF"], ["\u1BBA", "\u1BE5"], ["\u1C00", "\u1C23"], ["\u1C4D", "\u1C4F"], ["\u1C5A", "\u1C77"], ["\u1CE9", "\u1CEC"], ["\u1CEE", "\u1CF1"], ["\u1CF5", "\u1CF6"], ["\u2135", "\u2138"], ["\u2D30", "\u2D67"], ["\u2D80", "\u2D96"], ["\u2DA0", "\u2DA6"], ["\u2DA8", "\u2DAE"], ["\u2DB0", "\u2DB6"], ["\u2DB8", "\u2DBE"], ["\u2DC0", "\u2DC6"], ["\u2DC8", "\u2DCE"], ["\u2DD0", "\u2DD6"], ["\u2DD8", "\u2DDE"], "\u3006", "\u303C", ["\u3041", "\u3096"], "\u309F", ["\u30A1", "\u30FA"], "\u30FF", ["\u3105", "\u312D"], ["\u3131", "\u318E"], ["\u31A0", "\u31BA"], ["\u31F0", "\u31FF"], ["\u3400", "\u4DB5"], ["\u4E00", "\u9FCC"], ["\uA000", "\uA014"], ["\uA016", "\uA48C"], ["\uA4D0", "\uA4F7"], ["\uA500", "\uA60B"], ["\uA610", "\uA61F"], ["\uA62A", "\uA62B"], "\uA66E", ["\uA6A0", "\uA6E5"], ["\uA7FB", "\uA801"], ["\uA803", "\uA805"], ["\uA807", "\uA80A"], ["\uA80C", "\uA822"], ["\uA840", "\uA873"], ["\uA882", "\uA8B3"], ["\uA8F2", "\uA8F7"], "\uA8FB", ["\uA90A", "\uA925"], ["\uA930", "\uA946"], ["\uA960", "\uA97C"], ["\uA984", "\uA9B2"], ["\uAA00", "\uAA28"], ["\uAA40", "\uAA42"], ["\uAA44", "\uAA4B"], ["\uAA60", "\uAA6F"], ["\uAA71", "\uAA76"], "\uAA7A", ["\uAA80", "\uAAAF"], "\uAAB1", ["\uAAB5", "\uAAB6"], ["\uAAB9", "\uAABD"], "\uAAC0", "\uAAC2", ["\uAADB", "\uAADC"], ["\uAAE0", "\uAAEA"], "\uAAF2", ["\uAB01", "\uAB06"], ["\uAB09", "\uAB0E"], ["\uAB11", "\uAB16"], ["\uAB20", "\uAB26"], ["\uAB28", "\uAB2E"], ["\uABC0", "\uABE2"], ["\uAC00", "\uD7A3"], ["\uD7B0", "\uD7C6"], ["\uD7CB", "\uD7FB"], ["\uF900", "\uFA6D"], ["\uFA70", "\uFAD9"], "\uFB1D", ["\uFB1F", "\uFB28"], ["\uFB2A", "\uFB36"], ["\uFB38", "\uFB3C"], "\uFB3E", ["\uFB40", "\uFB41"], ["\uFB43", "\uFB44"], ["\uFB46", "\uFBB1"], ["\uFBD3", "\uFD3D"], ["\uFD50", "\uFD8F"], ["\uFD92", "\uFDC7"], ["\uFDF0", "\uFDFB"], ["\uFE70", "\uFE74"], ["\uFE76", "\uFEFC"], ["\uFF66", "\uFF6F"], ["\uFF71", "\uFF9D"], ["\uFFA0", "\uFFBE"], ["\uFFC2", "\uFFC7"], ["\uFFCA", "\uFFCF"], ["\uFFD2", "\uFFD7"], ["\uFFDA", "\uFFDC"]], false, false),
        /^[\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC]/,
        peg$classExpectation(["\u01C5", "\u01C8", "\u01CB", "\u01F2", ["\u1F88", "\u1F8F"], ["\u1F98", "\u1F9F"], ["\u1FA8", "\u1FAF"], "\u1FBC", "\u1FCC", "\u1FFC"], false, false),
        /^[A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178-\u0179\u017B\u017D\u0181-\u0182\u0184\u0186-\u0187\u0189-\u018B\u018E-\u0191\u0193-\u0194\u0196-\u0198\u019C-\u019D\u019F-\u01A0\u01A2\u01A4\u01A6-\u01A7\u01A9\u01AC\u01AE-\u01AF\u01B1-\u01B3\u01B5\u01B7-\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A-\u023B\u023D-\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u0386\u0388-\u038A\u038C\u038E-\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9-\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0-\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E-\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D-\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA\uFF21-\uFF3A]/,
        peg$classExpectation([["A", "Z"], ["\xC0", "\xD6"], ["\xD8", "\xDE"], "\u0100", "\u0102", "\u0104", "\u0106", "\u0108", "\u010A", "\u010C", "\u010E", "\u0110", "\u0112", "\u0114", "\u0116", "\u0118", "\u011A", "\u011C", "\u011E", "\u0120", "\u0122", "\u0124", "\u0126", "\u0128", "\u012A", "\u012C", "\u012E", "\u0130", "\u0132", "\u0134", "\u0136", "\u0139", "\u013B", "\u013D", "\u013F", "\u0141", "\u0143", "\u0145", "\u0147", "\u014A", "\u014C", "\u014E", "\u0150", "\u0152", "\u0154", "\u0156", "\u0158", "\u015A", "\u015C", "\u015E", "\u0160", "\u0162", "\u0164", "\u0166", "\u0168", "\u016A", "\u016C", "\u016E", "\u0170", "\u0172", "\u0174", "\u0176", ["\u0178", "\u0179"], "\u017B", "\u017D", ["\u0181", "\u0182"], "\u0184", ["\u0186", "\u0187"], ["\u0189", "\u018B"], ["\u018E", "\u0191"], ["\u0193", "\u0194"], ["\u0196", "\u0198"], ["\u019C", "\u019D"], ["\u019F", "\u01A0"], "\u01A2", "\u01A4", ["\u01A6", "\u01A7"], "\u01A9", "\u01AC", ["\u01AE", "\u01AF"], ["\u01B1", "\u01B3"], "\u01B5", ["\u01B7", "\u01B8"], "\u01BC", "\u01C4", "\u01C7", "\u01CA", "\u01CD", "\u01CF", "\u01D1", "\u01D3", "\u01D5", "\u01D7", "\u01D9", "\u01DB", "\u01DE", "\u01E0", "\u01E2", "\u01E4", "\u01E6", "\u01E8", "\u01EA", "\u01EC", "\u01EE", "\u01F1", "\u01F4", ["\u01F6", "\u01F8"], "\u01FA", "\u01FC", "\u01FE", "\u0200", "\u0202", "\u0204", "\u0206", "\u0208", "\u020A", "\u020C", "\u020E", "\u0210", "\u0212", "\u0214", "\u0216", "\u0218", "\u021A", "\u021C", "\u021E", "\u0220", "\u0222", "\u0224", "\u0226", "\u0228", "\u022A", "\u022C", "\u022E", "\u0230", "\u0232", ["\u023A", "\u023B"], ["\u023D", "\u023E"], "\u0241", ["\u0243", "\u0246"], "\u0248", "\u024A", "\u024C", "\u024E", "\u0370", "\u0372", "\u0376", "\u0386", ["\u0388", "\u038A"], "\u038C", ["\u038E", "\u038F"], ["\u0391", "\u03A1"], ["\u03A3", "\u03AB"], "\u03CF", ["\u03D2", "\u03D4"], "\u03D8", "\u03DA", "\u03DC", "\u03DE", "\u03E0", "\u03E2", "\u03E4", "\u03E6", "\u03E8", "\u03EA", "\u03EC", "\u03EE", "\u03F4", "\u03F7", ["\u03F9", "\u03FA"], ["\u03FD", "\u042F"], "\u0460", "\u0462", "\u0464", "\u0466", "\u0468", "\u046A", "\u046C", "\u046E", "\u0470", "\u0472", "\u0474", "\u0476", "\u0478", "\u047A", "\u047C", "\u047E", "\u0480", "\u048A", "\u048C", "\u048E", "\u0490", "\u0492", "\u0494", "\u0496", "\u0498", "\u049A", "\u049C", "\u049E", "\u04A0", "\u04A2", "\u04A4", "\u04A6", "\u04A8", "\u04AA", "\u04AC", "\u04AE", "\u04B0", "\u04B2", "\u04B4", "\u04B6", "\u04B8", "\u04BA", "\u04BC", "\u04BE", ["\u04C0", "\u04C1"], "\u04C3", "\u04C5", "\u04C7", "\u04C9", "\u04CB", "\u04CD", "\u04D0", "\u04D2", "\u04D4", "\u04D6", "\u04D8", "\u04DA", "\u04DC", "\u04DE", "\u04E0", "\u04E2", "\u04E4", "\u04E6", "\u04E8", "\u04EA", "\u04EC", "\u04EE", "\u04F0", "\u04F2", "\u04F4", "\u04F6", "\u04F8", "\u04FA", "\u04FC", "\u04FE", "\u0500", "\u0502", "\u0504", "\u0506", "\u0508", "\u050A", "\u050C", "\u050E", "\u0510", "\u0512", "\u0514", "\u0516", "\u0518", "\u051A", "\u051C", "\u051E", "\u0520", "\u0522", "\u0524", "\u0526", ["\u0531", "\u0556"], ["\u10A0", "\u10C5"], "\u10C7", "\u10CD", "\u1E00", "\u1E02", "\u1E04", "\u1E06", "\u1E08", "\u1E0A", "\u1E0C", "\u1E0E", "\u1E10", "\u1E12", "\u1E14", "\u1E16", "\u1E18", "\u1E1A", "\u1E1C", "\u1E1E", "\u1E20", "\u1E22", "\u1E24", "\u1E26", "\u1E28", "\u1E2A", "\u1E2C", "\u1E2E", "\u1E30", "\u1E32", "\u1E34", "\u1E36", "\u1E38", "\u1E3A", "\u1E3C", "\u1E3E", "\u1E40", "\u1E42", "\u1E44", "\u1E46", "\u1E48", "\u1E4A", "\u1E4C", "\u1E4E", "\u1E50", "\u1E52", "\u1E54", "\u1E56", "\u1E58", "\u1E5A", "\u1E5C", "\u1E5E", "\u1E60", "\u1E62", "\u1E64", "\u1E66", "\u1E68", "\u1E6A", "\u1E6C", "\u1E6E", "\u1E70", "\u1E72", "\u1E74", "\u1E76", "\u1E78", "\u1E7A", "\u1E7C", "\u1E7E", "\u1E80", "\u1E82", "\u1E84", "\u1E86", "\u1E88", "\u1E8A", "\u1E8C", "\u1E8E", "\u1E90", "\u1E92", "\u1E94", "\u1E9E", "\u1EA0", "\u1EA2", "\u1EA4", "\u1EA6", "\u1EA8", "\u1EAA", "\u1EAC", "\u1EAE", "\u1EB0", "\u1EB2", "\u1EB4", "\u1EB6", "\u1EB8", "\u1EBA", "\u1EBC", "\u1EBE", "\u1EC0", "\u1EC2", "\u1EC4", "\u1EC6", "\u1EC8", "\u1ECA", "\u1ECC", "\u1ECE", "\u1ED0", "\u1ED2", "\u1ED4", "\u1ED6", "\u1ED8", "\u1EDA", "\u1EDC", "\u1EDE", "\u1EE0", "\u1EE2", "\u1EE4", "\u1EE6", "\u1EE8", "\u1EEA", "\u1EEC", "\u1EEE", "\u1EF0", "\u1EF2", "\u1EF4", "\u1EF6", "\u1EF8", "\u1EFA", "\u1EFC", "\u1EFE", ["\u1F08", "\u1F0F"], ["\u1F18", "\u1F1D"], ["\u1F28", "\u1F2F"], ["\u1F38", "\u1F3F"], ["\u1F48", "\u1F4D"], "\u1F59", "\u1F5B", "\u1F5D", "\u1F5F", ["\u1F68", "\u1F6F"], ["\u1FB8", "\u1FBB"], ["\u1FC8", "\u1FCB"], ["\u1FD8", "\u1FDB"], ["\u1FE8", "\u1FEC"], ["\u1FF8", "\u1FFB"], "\u2102", "\u2107", ["\u210B", "\u210D"], ["\u2110", "\u2112"], "\u2115", ["\u2119", "\u211D"], "\u2124", "\u2126", "\u2128", ["\u212A", "\u212D"], ["\u2130", "\u2133"], ["\u213E", "\u213F"], "\u2145", "\u2183", ["\u2C00", "\u2C2E"], "\u2C60", ["\u2C62", "\u2C64"], "\u2C67", "\u2C69", "\u2C6B", ["\u2C6D", "\u2C70"], "\u2C72", "\u2C75", ["\u2C7E", "\u2C80"], "\u2C82", "\u2C84", "\u2C86", "\u2C88", "\u2C8A", "\u2C8C", "\u2C8E", "\u2C90", "\u2C92", "\u2C94", "\u2C96", "\u2C98", "\u2C9A", "\u2C9C", "\u2C9E", "\u2CA0", "\u2CA2", "\u2CA4", "\u2CA6", "\u2CA8", "\u2CAA", "\u2CAC", "\u2CAE", "\u2CB0", "\u2CB2", "\u2CB4", "\u2CB6", "\u2CB8", "\u2CBA", "\u2CBC", "\u2CBE", "\u2CC0", "\u2CC2", "\u2CC4", "\u2CC6", "\u2CC8", "\u2CCA", "\u2CCC", "\u2CCE", "\u2CD0", "\u2CD2", "\u2CD4", "\u2CD6", "\u2CD8", "\u2CDA", "\u2CDC", "\u2CDE", "\u2CE0", "\u2CE2", "\u2CEB", "\u2CED", "\u2CF2", "\uA640", "\uA642", "\uA644", "\uA646", "\uA648", "\uA64A", "\uA64C", "\uA64E", "\uA650", "\uA652", "\uA654", "\uA656", "\uA658", "\uA65A", "\uA65C", "\uA65E", "\uA660", "\uA662", "\uA664", "\uA666", "\uA668", "\uA66A", "\uA66C", "\uA680", "\uA682", "\uA684", "\uA686", "\uA688", "\uA68A", "\uA68C", "\uA68E", "\uA690", "\uA692", "\uA694", "\uA696", "\uA722", "\uA724", "\uA726", "\uA728", "\uA72A", "\uA72C", "\uA72E", "\uA732", "\uA734", "\uA736", "\uA738", "\uA73A", "\uA73C", "\uA73E", "\uA740", "\uA742", "\uA744", "\uA746", "\uA748", "\uA74A", "\uA74C", "\uA74E", "\uA750", "\uA752", "\uA754", "\uA756", "\uA758", "\uA75A", "\uA75C", "\uA75E", "\uA760", "\uA762", "\uA764", "\uA766", "\uA768", "\uA76A", "\uA76C", "\uA76E", "\uA779", "\uA77B", ["\uA77D", "\uA77E"], "\uA780", "\uA782", "\uA784", "\uA786", "\uA78B", "\uA78D", "\uA790", "\uA792", "\uA7A0", "\uA7A2", "\uA7A4", "\uA7A6", "\uA7A8", "\uA7AA", ["\uFF21", "\uFF3A"]], false, false),
        /^[\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E-\u094F\u0982-\u0983\u09BE-\u09C0\u09C7-\u09C8\u09CB-\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB-\u0ACC\u0B02-\u0B03\u0B3E\u0B40\u0B47-\u0B48\u0B4B-\u0B4C\u0B57\u0BBE-\u0BBF\u0BC1-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82-\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7-\u0CC8\u0CCA-\u0CCB\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82-\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2-\u0DF3\u0F3E-\u0F3F\u0F7F\u102B-\u102C\u1031\u1038\u103B-\u103C\u1056-\u1057\u1062-\u1064\u1067-\u106D\u1083-\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7-\u17C8\u1923-\u1926\u1929-\u192B\u1930-\u1931\u1933-\u1938\u19B0-\u19C0\u19C8-\u19C9\u1A19-\u1A1A\u1A55\u1A57\u1A61\u1A63-\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43-\u1B44\u1B82\u1BA1\u1BA6-\u1BA7\u1BAA\u1BAC-\u1BAD\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2-\u1BF3\u1C24-\u1C2B\u1C34-\u1C35\u1CE1\u1CF2-\u1CF3\u302E-\u302F\uA823-\uA824\uA827\uA880-\uA881\uA8B4-\uA8C3\uA952-\uA953\uA983\uA9B4-\uA9B5\uA9BA-\uA9BB\uA9BD-\uA9C0\uAA2F-\uAA30\uAA33-\uAA34\uAA4D\uAA7B\uAAEB\uAAEE-\uAAEF\uAAF5\uABE3-\uABE4\uABE6-\uABE7\uABE9-\uABEA\uABEC]/,
        peg$classExpectation(["\u0903", "\u093B", ["\u093E", "\u0940"], ["\u0949", "\u094C"], ["\u094E", "\u094F"], ["\u0982", "\u0983"], ["\u09BE", "\u09C0"], ["\u09C7", "\u09C8"], ["\u09CB", "\u09CC"], "\u09D7", "\u0A03", ["\u0A3E", "\u0A40"], "\u0A83", ["\u0ABE", "\u0AC0"], "\u0AC9", ["\u0ACB", "\u0ACC"], ["\u0B02", "\u0B03"], "\u0B3E", "\u0B40", ["\u0B47", "\u0B48"], ["\u0B4B", "\u0B4C"], "\u0B57", ["\u0BBE", "\u0BBF"], ["\u0BC1", "\u0BC2"], ["\u0BC6", "\u0BC8"], ["\u0BCA", "\u0BCC"], "\u0BD7", ["\u0C01", "\u0C03"], ["\u0C41", "\u0C44"], ["\u0C82", "\u0C83"], "\u0CBE", ["\u0CC0", "\u0CC4"], ["\u0CC7", "\u0CC8"], ["\u0CCA", "\u0CCB"], ["\u0CD5", "\u0CD6"], ["\u0D02", "\u0D03"], ["\u0D3E", "\u0D40"], ["\u0D46", "\u0D48"], ["\u0D4A", "\u0D4C"], "\u0D57", ["\u0D82", "\u0D83"], ["\u0DCF", "\u0DD1"], ["\u0DD8", "\u0DDF"], ["\u0DF2", "\u0DF3"], ["\u0F3E", "\u0F3F"], "\u0F7F", ["\u102B", "\u102C"], "\u1031", "\u1038", ["\u103B", "\u103C"], ["\u1056", "\u1057"], ["\u1062", "\u1064"], ["\u1067", "\u106D"], ["\u1083", "\u1084"], ["\u1087", "\u108C"], "\u108F", ["\u109A", "\u109C"], "\u17B6", ["\u17BE", "\u17C5"], ["\u17C7", "\u17C8"], ["\u1923", "\u1926"], ["\u1929", "\u192B"], ["\u1930", "\u1931"], ["\u1933", "\u1938"], ["\u19B0", "\u19C0"], ["\u19C8", "\u19C9"], ["\u1A19", "\u1A1A"], "\u1A55", "\u1A57", "\u1A61", ["\u1A63", "\u1A64"], ["\u1A6D", "\u1A72"], "\u1B04", "\u1B35", "\u1B3B", ["\u1B3D", "\u1B41"], ["\u1B43", "\u1B44"], "\u1B82", "\u1BA1", ["\u1BA6", "\u1BA7"], "\u1BAA", ["\u1BAC", "\u1BAD"], "\u1BE7", ["\u1BEA", "\u1BEC"], "\u1BEE", ["\u1BF2", "\u1BF3"], ["\u1C24", "\u1C2B"], ["\u1C34", "\u1C35"], "\u1CE1", ["\u1CF2", "\u1CF3"], ["\u302E", "\u302F"], ["\uA823", "\uA824"], "\uA827", ["\uA880", "\uA881"], ["\uA8B4", "\uA8C3"], ["\uA952", "\uA953"], "\uA983", ["\uA9B4", "\uA9B5"], ["\uA9BA", "\uA9BB"], ["\uA9BD", "\uA9C0"], ["\uAA2F", "\uAA30"], ["\uAA33", "\uAA34"], "\uAA4D", "\uAA7B", "\uAAEB", ["\uAAEE", "\uAAEF"], "\uAAF5", ["\uABE3", "\uABE4"], ["\uABE6", "\uABE7"], ["\uABE9", "\uABEA"], "\uABEC"], false, false),
        /^[\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u08FE\u0900-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962-\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2-\u09E3\u0A01-\u0A02\u0A3C\u0A41-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A70-\u0A71\u0A75\u0A81-\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7-\u0AC8\u0ACD\u0AE2-\u0AE3\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62-\u0B63\u0B82\u0BC0\u0BCD\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C62-\u0C63\u0CBC\u0CBF\u0CC6\u0CCC-\u0CCD\u0CE2-\u0CE3\u0D41-\u0D44\u0D4D\u0D62-\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86-\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039-\u103A\u103D-\u103E\u1058-\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085-\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17B4-\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u1922\u1927-\u1928\u1932\u1939-\u193B\u1A17-\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80-\u1B81\u1BA2-\u1BA5\u1BA8-\u1BA9\u1BAB\u1BE6\u1BE8-\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1DC0-\u1DE6\u1DFC-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099-\u309A\uA66F\uA674-\uA67D\uA69F\uA6F0-\uA6F1\uA802\uA806\uA80B\uA825-\uA826\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uAA29-\uAA2E\uAA31-\uAA32\uAA35-\uAA36\uAA43\uAA4C\uAAB0\uAAB2-\uAAB4\uAAB7-\uAAB8\uAABE-\uAABF\uAAC1\uAAEC-\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE26]/,
        peg$classExpectation([["\u0300", "\u036F"], ["\u0483", "\u0487"], ["\u0591", "\u05BD"], "\u05BF", ["\u05C1", "\u05C2"], ["\u05C4", "\u05C5"], "\u05C7", ["\u0610", "\u061A"], ["\u064B", "\u065F"], "\u0670", ["\u06D6", "\u06DC"], ["\u06DF", "\u06E4"], ["\u06E7", "\u06E8"], ["\u06EA", "\u06ED"], "\u0711", ["\u0730", "\u074A"], ["\u07A6", "\u07B0"], ["\u07EB", "\u07F3"], ["\u0816", "\u0819"], ["\u081B", "\u0823"], ["\u0825", "\u0827"], ["\u0829", "\u082D"], ["\u0859", "\u085B"], ["\u08E4", "\u08FE"], ["\u0900", "\u0902"], "\u093A", "\u093C", ["\u0941", "\u0948"], "\u094D", ["\u0951", "\u0957"], ["\u0962", "\u0963"], "\u0981", "\u09BC", ["\u09C1", "\u09C4"], "\u09CD", ["\u09E2", "\u09E3"], ["\u0A01", "\u0A02"], "\u0A3C", ["\u0A41", "\u0A42"], ["\u0A47", "\u0A48"], ["\u0A4B", "\u0A4D"], "\u0A51", ["\u0A70", "\u0A71"], "\u0A75", ["\u0A81", "\u0A82"], "\u0ABC", ["\u0AC1", "\u0AC5"], ["\u0AC7", "\u0AC8"], "\u0ACD", ["\u0AE2", "\u0AE3"], "\u0B01", "\u0B3C", "\u0B3F", ["\u0B41", "\u0B44"], "\u0B4D", "\u0B56", ["\u0B62", "\u0B63"], "\u0B82", "\u0BC0", "\u0BCD", ["\u0C3E", "\u0C40"], ["\u0C46", "\u0C48"], ["\u0C4A", "\u0C4D"], ["\u0C55", "\u0C56"], ["\u0C62", "\u0C63"], "\u0CBC", "\u0CBF", "\u0CC6", ["\u0CCC", "\u0CCD"], ["\u0CE2", "\u0CE3"], ["\u0D41", "\u0D44"], "\u0D4D", ["\u0D62", "\u0D63"], "\u0DCA", ["\u0DD2", "\u0DD4"], "\u0DD6", "\u0E31", ["\u0E34", "\u0E3A"], ["\u0E47", "\u0E4E"], "\u0EB1", ["\u0EB4", "\u0EB9"], ["\u0EBB", "\u0EBC"], ["\u0EC8", "\u0ECD"], ["\u0F18", "\u0F19"], "\u0F35", "\u0F37", "\u0F39", ["\u0F71", "\u0F7E"], ["\u0F80", "\u0F84"], ["\u0F86", "\u0F87"], ["\u0F8D", "\u0F97"], ["\u0F99", "\u0FBC"], "\u0FC6", ["\u102D", "\u1030"], ["\u1032", "\u1037"], ["\u1039", "\u103A"], ["\u103D", "\u103E"], ["\u1058", "\u1059"], ["\u105E", "\u1060"], ["\u1071", "\u1074"], "\u1082", ["\u1085", "\u1086"], "\u108D", "\u109D", ["\u135D", "\u135F"], ["\u1712", "\u1714"], ["\u1732", "\u1734"], ["\u1752", "\u1753"], ["\u1772", "\u1773"], ["\u17B4", "\u17B5"], ["\u17B7", "\u17BD"], "\u17C6", ["\u17C9", "\u17D3"], "\u17DD", ["\u180B", "\u180D"], "\u18A9", ["\u1920", "\u1922"], ["\u1927", "\u1928"], "\u1932", ["\u1939", "\u193B"], ["\u1A17", "\u1A18"], "\u1A1B", "\u1A56", ["\u1A58", "\u1A5E"], "\u1A60", "\u1A62", ["\u1A65", "\u1A6C"], ["\u1A73", "\u1A7C"], "\u1A7F", ["\u1B00", "\u1B03"], "\u1B34", ["\u1B36", "\u1B3A"], "\u1B3C", "\u1B42", ["\u1B6B", "\u1B73"], ["\u1B80", "\u1B81"], ["\u1BA2", "\u1BA5"], ["\u1BA8", "\u1BA9"], "\u1BAB", "\u1BE6", ["\u1BE8", "\u1BE9"], "\u1BED", ["\u1BEF", "\u1BF1"], ["\u1C2C", "\u1C33"], ["\u1C36", "\u1C37"], ["\u1CD0", "\u1CD2"], ["\u1CD4", "\u1CE0"], ["\u1CE2", "\u1CE8"], "\u1CED", "\u1CF4", ["\u1DC0", "\u1DE6"], ["\u1DFC", "\u1DFF"], ["\u20D0", "\u20DC"], "\u20E1", ["\u20E5", "\u20F0"], ["\u2CEF", "\u2CF1"], "\u2D7F", ["\u2DE0", "\u2DFF"], ["\u302A", "\u302D"], ["\u3099", "\u309A"], "\uA66F", ["\uA674", "\uA67D"], "\uA69F", ["\uA6F0", "\uA6F1"], "\uA802", "\uA806", "\uA80B", ["\uA825", "\uA826"], "\uA8C4", ["\uA8E0", "\uA8F1"], ["\uA926", "\uA92D"], ["\uA947", "\uA951"], ["\uA980", "\uA982"], "\uA9B3", ["\uA9B6", "\uA9B9"], "\uA9BC", ["\uAA29", "\uAA2E"], ["\uAA31", "\uAA32"], ["\uAA35", "\uAA36"], "\uAA43", "\uAA4C", "\uAAB0", ["\uAAB2", "\uAAB4"], ["\uAAB7", "\uAAB8"], ["\uAABE", "\uAABF"], "\uAAC1", ["\uAAEC", "\uAAED"], "\uAAF6", "\uABE5", "\uABE8", "\uABED", "\uFB1E", ["\uFE00", "\uFE0F"], ["\uFE20", "\uFE26"]], false, false),
        /^[0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]/,
        peg$classExpectation([["0", "9"], ["\u0660", "\u0669"], ["\u06F0", "\u06F9"], ["\u07C0", "\u07C9"], ["\u0966", "\u096F"], ["\u09E6", "\u09EF"], ["\u0A66", "\u0A6F"], ["\u0AE6", "\u0AEF"], ["\u0B66", "\u0B6F"], ["\u0BE6", "\u0BEF"], ["\u0C66", "\u0C6F"], ["\u0CE6", "\u0CEF"], ["\u0D66", "\u0D6F"], ["\u0E50", "\u0E59"], ["\u0ED0", "\u0ED9"], ["\u0F20", "\u0F29"], ["\u1040", "\u1049"], ["\u1090", "\u1099"], ["\u17E0", "\u17E9"], ["\u1810", "\u1819"], ["\u1946", "\u194F"], ["\u19D0", "\u19D9"], ["\u1A80", "\u1A89"], ["\u1A90", "\u1A99"], ["\u1B50", "\u1B59"], ["\u1BB0", "\u1BB9"], ["\u1C40", "\u1C49"], ["\u1C50", "\u1C59"], ["\uA620", "\uA629"], ["\uA8D0", "\uA8D9"], ["\uA900", "\uA909"], ["\uA9D0", "\uA9D9"], ["\uAA50", "\uAA59"], ["\uABF0", "\uABF9"], ["\uFF10", "\uFF19"]], false, false),
        /^[\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF]/,
        peg$classExpectation([["\u16EE", "\u16F0"], ["\u2160", "\u2182"], ["\u2185", "\u2188"], "\u3007", ["\u3021", "\u3029"], ["\u3038", "\u303A"], ["\uA6E6", "\uA6EF"]], false, false),
        /^[_\u203F-\u2040\u2054\uFE33-\uFE34\uFE4D-\uFE4F\uFF3F]/,
        peg$classExpectation(["_", ["\u203F", "\u2040"], "\u2054", ["\uFE33", "\uFE34"], ["\uFE4D", "\uFE4F"], "\uFF3F"], false, false),
        /^[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/,
        peg$classExpectation([" ", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u202F", "\u205F", "\u3000"], false, false),
        "break",
        peg$literalExpectation("break", false),
        "case",
        peg$literalExpectation("case", false),
        "catch",
        peg$literalExpectation("catch", false),
        "class",
        peg$literalExpectation("class", false),
        "const",
        peg$literalExpectation("const", false),
        "continue",
        peg$literalExpectation("continue", false),
        "debugger",
        peg$literalExpectation("debugger", false),
        "default",
        peg$literalExpectation("default", false),
        "delete",
        peg$literalExpectation("delete", false),
        "do",
        peg$literalExpectation("do", false),
        "else",
        peg$literalExpectation("else", false),
        "enum",
        peg$literalExpectation("enum", false),
        "export",
        peg$literalExpectation("export", false),
        "extends",
        peg$literalExpectation("extends", false),
        "false",
        peg$literalExpectation("false", false),
        "finally",
        peg$literalExpectation("finally", false),
        "for",
        peg$literalExpectation("for", false),
        "function",
        peg$literalExpectation("function", false),
        "get",
        peg$literalExpectation("get", false),
        "if",
        peg$literalExpectation("if", false),
        "import",
        peg$literalExpectation("import", false),
        "instanceof",
        peg$literalExpectation("instanceof", false),
        "in",
        peg$literalExpectation("in", false),
        "new",
        peg$literalExpectation("new", false),
        "null",
        peg$literalExpectation("null", false),
        "return",
        peg$literalExpectation("return", false),
        "set",
        peg$literalExpectation("set", false),
        "super",
        peg$literalExpectation("super", false),
        "switch",
        peg$literalExpectation("switch", false),
        "this",
        peg$literalExpectation("this", false),
        "throw",
        peg$literalExpectation("throw", false),
        "true",
        peg$literalExpectation("true", false),
        "try",
        peg$literalExpectation("try", false),
        "typeof",
        peg$literalExpectation("typeof", false),
        "var",
        peg$literalExpectation("var", false),
        "void",
        peg$literalExpectation("void", false),
        "while",
        peg$literalExpectation("while", false),
        "with",
        peg$literalExpectation("with", false),
        ";",
        peg$literalExpectation(";", false),
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
        peg$literalExpectation("++", false),
        "--",
        peg$literalExpectation("--", false),
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
        peg$literalExpectation("+", false),
        "-",
        peg$literalExpectation("-", false),
        "~",
        peg$literalExpectation("~", false),
        "!",
        peg$literalExpectation("!", false),
        "*",
        peg$literalExpectation("*", false),
        "%",
        peg$literalExpectation("%", false),
        /^[+=]/,
        peg$classExpectation(["+", "="], false, false),
        /^[\-=]/,
        peg$classExpectation(["-", "="], false, false),
        "<<",
        peg$literalExpectation("<<", false),
        ">>>",
        peg$literalExpectation(">>>", false),
        ">>",
        peg$literalExpectation(">>", false),
        "<=",
        peg$literalExpectation("<=", false),
        ">=",
        peg$literalExpectation(">=", false),
        "<",
        peg$literalExpectation("<", false),
        ">",
        peg$literalExpectation(">", false),
        "===",
        peg$literalExpectation("===", false),
        "!==",
        peg$literalExpectation("!==", false),
        "==",
        peg$literalExpectation("==", false),
        "!=",
        peg$literalExpectation("!=", false),
        "&",
        peg$literalExpectation("&", false),
        /^[&=]/,
        peg$classExpectation(["&", "="], false, false),
        "^",
        peg$literalExpectation("^", false),
        /^[|=]/,
        peg$classExpectation(["|", "="], false, false),
        "&&",
        peg$literalExpectation("&&", false),
        "||",
        peg$literalExpectation("||", false),
        "*=",
        peg$literalExpectation("*=", false),
        "/=",
        peg$literalExpectation("/=", false),
        "%=",
        peg$literalExpectation("%=", false),
        "+=",
        peg$literalExpectation("+=", false),
        "-=",
        peg$literalExpectation("-=", false),
        "<<=",
        peg$literalExpectation("<<=", false),
        ">>=",
        peg$literalExpectation(">>=", false),
        ">>>=",
        peg$literalExpectation(">>>=", false),
        "&=",
        peg$literalExpectation("&=", false),
        "^=",
        peg$literalExpectation("^=", false),
        "|=",
        peg$literalExpectation("|=", false),
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
        peg$decode("4\x7F\"\"5!7\x80"),
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
        peg$decode(";\x80.# &;\x7F"),
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
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
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

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

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
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
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

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
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
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse:       peg$parse
};

},{}],57:[function(require,module,exports){
module.exports = Rule

const uuid = require('uuid').v1

const HeadCompiler = require('./compile/head')

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
  const self = this

  let head
  let compiled

  const headCompiler = new HeadCompiler(ruleObj, {
    replacements: self.Replacements,
    scope: self.Scope
  })

  for (let headNo = ruleObj.head.length - 1; headNo >= 0; headNo--) {
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

  for (const key in data) {
    compiledFunction[key] = data[key]
  }

  if (!this[functor]) {
    this[functor] = []
  }

  this[functor].push(compiledFunction)
}

Rule.prototype._setReplacements = function (globalReplacements) {
  const self = this

  ;['guard', 'body'].forEach(function (location) {
    self._source[location] = self._source[location].map(function (el) {
      if (el.type !== 'Replacement') {
        return el
      }

      let replacementId

      if (typeof el.num !== 'undefined') {
        replacementId = el.num
        if (!globalReplacements[replacementId]) {
          throw new Error('There is no replacement with number ' + replacementId)
        }

        self.Replacements[replacementId] = globalReplacements[replacementId]
        return el
      }

      if (typeof el.expr !== 'undefined' && globalReplacements && globalReplacements.length > 0) {
        // attention: this mutates the globalReplacement parameter!
        const replacement = globalReplacements.shift()

        // get free uuid
        replacementId = uuid()
        self.Replacements[replacementId] = replacement

        // adapt source object
        const newElement = {
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
  const self = this

  for (const functor in self) {
    if (!functor.match(/^[a-z]/)) {
      continue
    }

    callback.call(thisArg, self[functor])
  }
}

Rule.prototype.Fire = function fireConstraint (chr, constraint) {
  const self = this
  const replacements = this.Replacements

  return Promise.resolve().then(callback2Promise({
    event: 'rule:try',
    rule: self.Name,
    location: self._source.location,
    constraint: constraint
  }, this.Breakpoints.onTry)).then(function () {
    const occurrences = self[constraint.functor].length - 1

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
  const f = Array.prototype.slice.call(arguments, -1)[0]
  if (!f) {
    return function () {
      return Promise.resolve()
    }
  }

  const self = this
  const data = Array.prototype.slice.call(arguments, 0, -1)
  return function () {
    return new Promise(function (resolve) {
      data.push(resolve)
      f.apply(self, data)
    })
  }
}

},{"./compile/head":49,"uuid":29}],58:[function(require,module,exports){
module.exports = Rules

const dynamicCaller = require('./dynamic-caller')
const Rule = require('./rule')

function Rules (chr) {
  this._chr = chr

  this.Order = []
}

Rules.prototype.Add = function addRule (ruleObj, globalReplacements) {
  const self = this

  const rule = new Rule(ruleObj, {
    replacements: globalReplacements,
    scope: self._chr.Scope
  })
  const ruleName = rule.Name

  if (typeof this[ruleName] !== 'undefined') {
    throw new Error('Rule with name "' + ruleName + '" multiple times specified')
  }

  this[ruleName] = rule
  this.Order.push(rule.Name)

  let constraintName
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
  const self = this
  const chr = this._chr

  let constraintName
  for (const functor in chr.Constraints) {
    constraintName = functor.split('/')[0]
    if (typeof chr[constraintName] !== 'undefined') {
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
  const self = this

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

},{"./dynamic-caller":52,"./rule":57}],59:[function(require,module,exports){
module.exports = Store

const util = require('util')
const events = require('events')

const Table = require('easy-table')

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
  const id = this._getNewConstraintId()
  constraint.id = id
  this._store[id] = constraint
  this._addToIndex(constraint)
  this.length += 1

  this.emit('add', constraint)

  return id
}

Store.prototype.kill = function kill (id) {
  const constraint = this._store[id]
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
  const index = this._index
  if (typeof index[constraint.name] === 'undefined') {
    index[constraint.name] = {}
  }
  if (typeof index[constraint.name][constraint.arity] === 'undefined') {
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
  const index = this._index

  if (typeof index[name] !== 'undefined' &&
    typeof index[name][arity] !== 'undefined') {
    return Object.keys(index[name][arity])
  }

  return []
}

Store.prototype.invalidate = function invalidate () {
  this.reset()
  this.invalid = true
}

Store.prototype.forEach = function (cb) {
  for (const id in this._store) {
    cb(this._store[id], id)
  }
}

Store.prototype.map = function (callback, thisArg) {
  const res = []
  for (const id in this._store) {
    res.push(callback.call(thisArg, this._store[id], id, this))
  }
  return res
}

Store.prototype.toString = function () {
  if (this.length === 0) {
    return '(empty)'
  }

  const t = new Table()

  this.forEach(function (constraint) {
    t.cell('ID', constraint.id)
    t.cell('Constraint', constraint.toString())
    t.newRow()
  })

  return t.toString()
}

},{"easy-table":10,"events":12,"util":28}]},{},[54])(54)
});
