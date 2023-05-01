let queue = require("@pioneer-platform/redis-queue")

let step = {
    step: '1',
    instruction: "use @schneehertz/google-it to create a skill that searchs google and returns json. the command will be google-it --query='*query string goes here*' -o results.json -n this outputs the file in JSON. you need to then read the file to output. the reason its saved is encase it is very large and you will need to chunk it to process it all",
    inputCount: 1,
    inputs: [{
        position:1,
        name:'searchParams',
        description:"the content of the query",
        example:"what is a keepkey?"
    }],
    outputs: {
        reaults:["an array of search results order by relivance"]
    }
}

let BOT_NAME = 'pioneer-skills-creator'
let work = {
    username:"test123",
    discord:"",
    channel:"1090511307524034642",
    userInfo:{},
    sessionId:"123123123",
    sessionInfo:{},
    userInfoPioneer:{},
    work:step
}

queue.createWork("bots:"+BOT_NAME+":ingest",work)