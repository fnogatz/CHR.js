#!/usr/bin/env node

const program = require('commander')
const concat = require('concat-stream')
const compile = require('../compile')

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

const file = program.args[0]
const opts = program.opts()

if (file) {
  compile.fromFile(file, opts, onFinish)
} else {
  process.stdin.pipe(concat({ encoding: 'string' }, function (source) {
    const code = compile(source, opts)
    onFinish(null, code)
  }))
}
