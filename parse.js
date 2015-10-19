module.exports = parse
module.exports.element = getElementParser

var path = require('path')
var fs = require('fs')
var PEG = require('pegjs')

var parser = require('./src/parser.peg.js')

function parse (src, elementName) {
  if (elementName) {
    return getElementParser(elementName)(src)
  }

  return parser.parse(src)
}

function getElementParser (elementName) {
  var parserSource = fs.readFileSync(path.join(__dirname, 'src', 'parser.pegjs'), 'utf8')

  var customParser = PEG.buildParser(parserSource, {
    allowedStartRules: [
      elementName
    ]
  })

  return customParser.parse
}
