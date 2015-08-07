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
