#!/usr/bin/env bash

#| node <<< "var o = $(cat); console.log(JSON.stringify(o, null, 4));"


echo '%7B%22other%22%3A%7B%22srcdb%22%3A%22999999%22%7D%2C%22criteria%22%3A%5B%7B%22field%22%3A%22alias%22%2C%22value%22%3A%22cs553%22%7D%5D%7D' \
| node <<< "var o = '$(cat)'; console.log(decodeURIComponent(o));"

curl "https://classes.oregonstate.edu/api/?page=fose&route=search" \
    --request POST \
    --header 'Content-Type: application/json' \
    --data '{"other":{"srcdb":"999999"},"criteria":[{"field":"alias","value":"cs553"}]}' \
| jq '.'