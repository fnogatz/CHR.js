# CHR.js

Compile and run Constraint Handling Rules (CHR) in JavaScript.

CHR.js is a just-in-time (JIT) compiler for Constraint Handling Rules, embedded in JavaScript. For better runtime performance it supports ahead-of-time (AOT) compilation too, either by its command line tool `chrjs` or [babel-plugin-chr](https://github.com/fnogatz/babel-plugin-chr), a plugin for Babel.

## Getting Started

The [online version at chrjs.net](http://chrjs.net/) is the easiest way to generate a constraint solver. Just enter your Constraint Handling Rules, try adding some constraints, and download the generated solver code.

## Example

The following CHR rule generates all fibonacci numbers upto a given index `Max` as constraints of the form `fib(Number,Value)`.

    upto(Max), fib(A,AV), fib(B,BV) ==> B === A+1, B < Max | fib(B+1,AV+BV)

The CHR rule can be used in JavaScript after declaring it via the `chr()` function, like in this example:


    var CHR = require('chr')             // load the module
    var konsole = require('chr/console') // little tool for graphical
                                         //   representations

    var chr = CHR()                      // create new handler
    
    // add the rule
    chr('upto(Max), fib(A,AV), fib(B,BV) ==> B === A+1, B < Max | fib(B+1,AV+BV)')

    konsole.log(chr.Store)               // print the content of the
                                         //   constraint store
    /* results in:
        ┌────────────┐                         
        │ Constraint │
        ├────────────┤
        │ (empty)    │
        └────────────┘
    */
       
    chr.fib(1,1)                         // the first fibonacci is 1
    chr.fib(2,1)                         // the second is 1

    konsole.log(chr.Store)               // both have been stored
    /* results in:
        ┌────────────┐
        │ Constraint │
        ├────────────┤
        │ fib(1,1)   │
        ├────────────┤
        │ fib(2,1)   │
        └────────────┘
    */

    // now generate the fibonaccis upto the 5th element
    chr.upto(5)
    konsole.log(chr.Store)
    /* results in:
        ┌────────────┐
        │ Constraint │
        ├────────────┤
        │ fib(1,1)   │
        ├────────────┤
        │ fib(2,1)   │
        ├────────────┤
        │ upto(5)    │
        ├────────────┤
        │ fib(3,2)   │
        ├────────────┤
        │ fib(4,3)   │
        ├────────────┤
        │ fib(5,5)   │
        └────────────┘
    */

More example CHR scripts are provided at [chrjs.net](http://chrjs.net/).

Defining CHR rules in this way, they are compiled at runtime, that means we use a just-in-time (JIT) compilation. However, for performance reasons, we encourage the use of an ahead-of-time (AOT) compiler as presented in the [next section](#aot-compilation).

## AOT Compilation

The easiest way to precompile your JavaScript source code with embedded Constraint Handling Rules is by using [babel-plugin-chr](https://github.com/fnogatz/babel-plugin-chr), a plugin for [Babel](http://babeljs.io/):

    npm install babel-plugin-chr
    babel --plugins chr script.js

However, CHR.js itself provides a command line tool to compile scripts that are dominated by Constraint Handling Rules:

    chrjs script.chr > script.js

Please note, that the given `.chr` files must be of the following form, where CHR rules are the main elements and arbitrary JavaScript code must be placed in a preamble section:

    {
      // preamble
      // code in this block can be used in the rules' guards and bodies

      function print (v) {
        console.log(v)
      }

      function pred (v) {
        return v < 5
      }
    }

    print_num     @ num(v) ==> ${ () => print(v) }
    generate_nums @ num(v) ==> ${ () => pred(v) } | num(v+1)

Functions ecapsulated in `${ ... }` are evaluated at rule application, as for JIT compilation too.

## Background

CHR.js was realized as a part of my Master Thesis in Computer Science at the University of Ulm, Germany. Its Project Report for a prototype implementation (versions `0.x`) with additional information about its architecture can be found online: https://fnogatz.github.io/paper-now-chrjs/.

The implementation is based on the compilation scheme presented in the paper [CHR for imperative host languages](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.149.8471) (2008; Peter Van Weert, Pieter Wuille, Tom Schrijvers, Bart Demoen). As of yet basically none of the mentioned optimizations have been implemented.
