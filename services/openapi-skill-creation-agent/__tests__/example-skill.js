let connection  = require("@pioneer-platform/default-mongo")
const skillsDB = connection.get('skills')

let skill = {
    "skillId": "CMD:0.0.1:highlander:google-search",
    "script": "#!/bin/bash\n" +
        "\n" +
        "RESPONSE_FILE=\"results.json\"\n" +
        "QUERY=\"$1\"\n" +
        "\n" +
        "# Install google-it package if not already installed\n" +
        "( npm install -g @schneehertz/google-it ) 2> /dev/null\n" +
        "\n" +
        "# Perform Google search and save results to response file\n" +
        "( google-it --query=\"$QUERY\" -o \"$RESPONSE_FILE\" -n ) 2> /dev/null\n" +
        "\n" +
        "# Read the response file and store it in a variable\n" +
        "RESULT=$(cat \"$RESPONSE_FILE\")\n" +
        "\n" +
        "# Remove the response file\n" +
        "rm \"$RESPONSE_FILE\"\n" +
        "\n" +
        "# Print the results in JSON format\n" +
        "printf '{ \"success\": true, \"output\": %s, \"summary\": \"Google search results for the query: %s\" }' \"$RESULT\" \"$QUERY\"",
    "inputsCount": 1,
    "inputs": [
        {
            "position": 1,
            "name": "searchParams",
            "description": "the content of the query",
            "example": "what is a keepkey?"
        }
    ],
    "outputs": {
        "results": [
            "an array of search results order by relevance"
        ]
    },
    "outputMap": {
        "success": "Boolean value; true if the query was successful",
        "output": "Array of search results ordered by relevance",
        "summary": "Brief summary of the search results"
    },
    "summary": "A skill that searches Google and returns results in JSON format using the google-it CLI",
    "keywords": [
        "bash",
        "script",
        "google-it",
        "search",
        "google",
        "json",
        "results"
    ]
}


//save to mongo
skillsDB.insert(skill)