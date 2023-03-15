let queue = require("@pioneer-platform/redis-queue")

let BOT_NAME = 'pioneer'
let work = {
    username:"test123",
    query:"what is 1 + 1",
}

queue.createWork("bots:"+BOT_NAME+":ingest",work)