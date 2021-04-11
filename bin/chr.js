#!/usr/bin/env node

var program = require('commander')
var concat = require('concat-stream')
var compile = require('../compile')

function onFinish (err, code) {
  if (err) {
    throw err
  }

  console.log(code)
}

program
  .usage('[options] <file>')
  .option('-O, --optimized', 'Use optimized compilation (only sync code)')
  .option('-b, --binding [expr]', 'Bind the CHR solver to this expression', 'module.exports')
  .option('-f, --function [expr]', 'Bind the CHR solver to this function')
  .option('-r, --runtime [expr]', 'Bind the CHR runtime to this function', "require('chr/runtime')")
  .parse(process.argv)

var file = program.args[0]
var opts = program

if (file) {
  compile.fromFile(file, opts, onFinish)
} else {
  process.stdin.pipe(concat({ encoding: 'string' }, function (source) {
    var code = compile(source, opts)
    onFinish(null, code)
  }))
}
