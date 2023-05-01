#!/bin/bash

ADDRESS="DBzgF78jXBxGzL4JnGiSRgxW3iTCjgAotp"

curl -s "https://blockchain.info/rawaddr/$ADDRESS?format=json" | \
  jq -r '.txs[0].hash' > last_txid.txt