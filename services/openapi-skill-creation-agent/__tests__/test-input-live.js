let queue = require("@pioneer-platform/redis-queue")

let BOT_NAME = 'pioneer-skills-creator'
let work = {
    username:"test123",
    discord:"",
    channel:"1090511307524034642",
    userInfo:{},
    sessionId:"123123123",
    sessionInfo:{},
    userInfoPioneer:{},
    work:"create a skill that installs Google CLI globally"
}

queue.createWork("bots:"+BOT_NAME+":ingest",work)