const {subscriber,publisher,redis,redisQueue} = require('@pioneer-platform/default-redis')

let task = {
    channel:"1090511307524034642",
    taskId:"123123123",
}

//send to discord
let payload = {
    channel:task.channel,
    responses:{
        sentences:['Attempted to solve task: '+task.taskId],
        views:[]
    }
}
publisher.publish('discord-bridge',JSON.stringify(payload))