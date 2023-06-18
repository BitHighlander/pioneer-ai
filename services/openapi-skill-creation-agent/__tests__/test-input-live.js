let queue = require("@pioneer-platform/redis-queue")

let step = {
    step: '1',
    instruction: "create a script that will clone a repo",
    inputCount: 1,
    inputs: [{
        position:1,
        name:'url',
        description:"the url to load",
        example:"https://github.com/BitHighlander/pioneer-ai"
    }],
    outputs: {
        results:["true"]
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