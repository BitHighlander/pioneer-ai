const {subscriber,publisher,redis,redisQueue} = require('@pioneer-platform/default-redis')

let task = {
    channel:"1123742848039272488",
    taskId:"123123123",
}

//send to discord
let payload = {
    channel:task.channel,
    responses:{
        sentences:['tx insight: '+task.taskId],
        views:[]
    }
}
publisher.publish('discord-bridge',JSON.stringify(payload))
