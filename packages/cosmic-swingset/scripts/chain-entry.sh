#! /bin/bash
# chain-entry.sh - decide whether to run ibc test setup or our chain
set -e
DIR=$(dirname -- "${BASH_SOURCE[0]}")
DIR=`cd "$DIR" && pwd`

CMD=$1
case $CMD in
single-node)
  # Run the IBC test script.
  shift
  cd
  export DAEMON=ag-chain-cosmos
  export CLI=ag-cosmos-helper
  export STAKE=10000000000uagstake
  exec "$DIR/single-node.sh" ${1+"$@"}
  ;;
*)
  # Just run our chain.
  exec "$DIR/../lib/ag-chain-cosmos" ${1+"$@"}
  ;;
esac