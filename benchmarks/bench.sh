#!/bin/bash

export BENCHTIME="$1"
shift

function doBench {
  TIMEFORMAT="%3U"
  (
    time (
      SIG=1
      NUM=0
      trap SIG=0 SIGALRM
      read PID REST </proc/self/stat
      (
        sleep $BENCHTIME
        kill -SIGALRM $PID
      ) &
      while [[ $SIG -gt 0 ]]; do
        "$@"
        NUM=$(($NUM+1))
      done >/dev/null 2>&1
      echo -n "$NUM "
    ) 2>&1
  ) | while read N T; do
    echo "print $T/$N,\" \",$N,\"\\n\"" | bc -ql
  done
}

doBench "$@"
