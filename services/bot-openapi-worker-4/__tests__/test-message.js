const {subscriber,publisher,redis,redisQueue} = require('@pioneer-platform/default-redis')

let event = {
    type:'update',
    username:'test123',
    response:{
        text:"wuddop bro"
    }
}
// console.log(publisher.publish('pioneer',JSON.stringify(event)))

let run_test = async function(){
    let result = await publisher.publish('pioneer',JSON.stringify(event))
    console.log(result)
}
run_test()