
const {redis,subscriber,publisher, redisQueue} = require("@pioneer-platform/default-redis")


let task = {
    summary: 'Search Google for KeepKey',
    finalGoal: 'Obtain search results for KeepKey on Google',
    steps: [
        {
            name: 'initiateGoogleSearch',
            action: "Use an API or script to search Google for 'KeepKey'",
            input: 'KeepKey',
            type: 'apiRequest'
        },
        {
            name: 'processGoogleSearchResults',
            action: 'Use a script to review the search results, extract relevant information, and confirm the correctness of the data',
            input: 'searchResults',
            type: 'script'
        },
        {
            name: 'returnSearchResults',
            action: "Return a JSON object containing the search results for 'KeepKey'",
            input: 'processedSearchResults',
            type: 'output'
        }
    ]
}

let view  = {
    type:"task",
    data:task,
    message:"test"
}

let payload = {
    channel:"1090511307524034642",
    responses:{
        sentences:[],
        views:[
            view
        ]
    }
}
publisher.publish('discord-bridge',JSON.stringify(payload))