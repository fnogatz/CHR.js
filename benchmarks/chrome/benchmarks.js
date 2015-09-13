function primes (N) {
  var profile = 'primes('+N+')'

  var chr = new CHR()
  chr`
    gen   @ upto(N) <=> N > 1 | upto(N-1), prime(N)
    sift  @ prime(X) \\ prime(Y) <=> Y % X == 0 | true
  `

  function test (N) {
    console.profile(profile)
    chr.upto(N).then(function () {
      console.profileEnd(profile)
      console.log('Done')
    })
  }

  test(N)
}
