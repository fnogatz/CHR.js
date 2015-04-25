# CHR.js

Compile and run Constraint Handling Rules (CHR) in JavaScript

## Install

    npm install chr

## Usage as CLI

If you install CHR.js via npm it will create a new `chrjs` executable:

    $ chrjs /path/to/your.chr > /created/constrainthandler.js

If no path is specified, `chrjs` reads from stdin.

## Usage with node.js

The CHR.js module can be used programmatically:

    var chrjs = require('chr')

    var code = chrjs.transform('a ==> b')
    chrjs.transformFile('path.chr', function(err, code) {
      console.log(code)
    })

## Example

Consider the following CHR source code, which generates all fibonacci numbers upto a given index `N` as constraints of the form `fib(Number,Value)`:

    upto(N), fib(A,AV), fib(B,BV) ==> B === A+1, B < N | fib(B+1,AV+BV);

The CHR source code can be compiled to JavaScript by the use of the `chrjs` command:

    $ echo 'upto(N), fib(A,AV), fib(B,BV) ==> B === A+1, B < N | fib(B+1,AV+BV);' | chrjs > fib.js

The generated JavaScript code has references to `chr/runtime` components, so make sure it is available. Open a REPL to play with the generated `fib.js`:

    $ node
    > var konsole = require('chr/console') // for graphical representation
    > var CHR = require('./fib.js')        // load the generated source
    > CHR.fib(1,1)                         // the first fibonacci is 0
    > CHR.fib(2,1)                         // the second is 1
    > konsole(CHR.Store)                   // print the content of the
    ┌────────────┐                         //   constraint store
    │ Constraint │
    ├────────────┤
    │ fib(1,1)   │
    ├────────────┤
    │ fib(2,1)   │
    └────────────┘
    > CHR.upto(5)                          // generate the first 5 fibs
    > konsole(CHR.Store)                   // print the content of the
    ┌────────────┐                         //   constraint store again
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
    > CHR.fib(6,8).fib(7,13)               // constraints allow chaining
    > CHR.Store.reset()                    // clear the constraint store

More example CHR scripts are provided in the project's `/examples` directory.    

## Background

The implementation is based on the compilation schema presented in the paper [CHR for imperative host languages](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.149.8471) (2008; Peter Van Weert, Pieter Wuille, Tom Schrijvers, Bart Demoen). As of yet basically none of the mentioned optimizations have been implemented.

## Todo

* Provide an option to bundle the `chr/runtime` references to get a single-file package executable for example in browsers.
* Add event emitters for rule application etc to provide an easy logging and debugging mechanism.
* Allow arithmetic patterns in the rule's head, for example `upto(Max), fib(N-1,V1), fib(N,V2) ==> N < Max | fib(N+1,V1+V2);`
* Add rules on the fly, for example `CHR.Rules.add('b ==> c')`.
* Add logical variables, i.e. support calling `CHR.leq($.A, $.B); CHR.leq($.B, $.A); console.log($.A === $.B)` in the `/examples/leq.chr` snippet.
* JIT-Compilation, i.e. support calling `var CHR = require('./fib.chr')`.
