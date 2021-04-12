module.exports = parse
module.exports.element = getElementParser

const path = require('path')
const fs = require('fs')
const PEG = require('pegjs')

const parser = require('./src/parser.peg.js')

function parse (src, elementName) {
  if (elementName) {
    return getElementParser(elementName)(src)
  }

  return parser.parse(src)
}

function getElementParser (elementName) {
  const parserSource = fs.readFileSync(path.join(__dirname, 'src', 'parser.pegjs'), 'utf8')

  const customParser = PEG.generate(parserSource, {
    allowedStartRules: [
      elementName
    ]
  })

  return customParser.parse
}
