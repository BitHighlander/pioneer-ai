#!/bin/bash

RESPONSE_FILE="results.json"
QUERY="$1"

# Install google-it package if not already installed
( npm install -g @schneehertz/google-it ) 2> /dev/null

# Perform Google search and save results to response file
( google-it --query="$QUERY" -o "$RESPONSE_FILE" -n ) 2> /dev/null

# Read the response file and store it in a variable
RESULT=$(cat "$RESPONSE_FILE")

# Remove the response file
rm "$RESPONSE_FILE"

# Print the results in JSON format
printf '{ "success": true, "output": %s, "summary": "Google search results for the query: %s" }' "$RESULT" "$QUERY"