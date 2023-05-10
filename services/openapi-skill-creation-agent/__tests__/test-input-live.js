let queue = require("@pioneer-platform/redis-queue")

let step = {
    step: '1',
    instruction: "create a script that will load a webpage and parse the html results and return JSON of only the text fields and summarized text",
    inputCount: 1,
    inputs: [{
        position:1,
        name:'url',
        description:"the url to load",
        example:"https://medium.com/artificial-corner/bye-bye-chatgpt-ai-tools-better-than-chatgpt-but-few-people-are-using-them-eac93a3627cc"
    }],
    outputs: {
        results:["an array of search results order by relevance"]
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