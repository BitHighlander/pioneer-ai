let queue = require("@pioneer-platform/redis-queue")

let BOT_NAME = 'pioneer-task-queue'
let work = {
    username:"test123",
    discord:"",
    channel:"1090511307524034642",
    userInfo:{},
    sessionId:"123123123",
    sessionInfo:{},
    userInfoPioneer:{},
    text:"search google for keepkey",
}

queue.createWork("bots:"+BOT_NAME+":ingest",work)