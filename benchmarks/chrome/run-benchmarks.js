var benchmarks = [
  function () {
    primes(100)
  }
]

benchmarks.forEach(function (benchmark) {
  benchmark()
})
