var CHR = require('../../')
var chr = new CHR()

chr`
  gen   @ upto(N) <=> N > 1 | upto(N-1), prime(N)
  sift  @ prime(X) \\ prime(Y) <=> Y % X == 0 | true
`

function test (N) {
  chr.upto(N).then(function () {
    console.log('Done')
  })
}

var N = parseInt(process.argv[2] || 600)
test(N)
