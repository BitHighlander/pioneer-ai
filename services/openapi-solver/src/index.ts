/*
      Skills creation worker

 */

let BOT_NAME = 'pioneer-solver-v1'
console.log("USING USE_GPT_4")

require('dotenv').config()
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../../.env"})

let packageInfo = require("../package.json")
const TAG = " | "+packageInfo.name+" | "
const util = require('util');
const log = require('@pioneer-platform/loggerdog')()
const {subscriber,publisher,redis,redisQueue} = require('@pioneer-platform/default-redis')
const short = require('short-uuid');
const coincap = require('@pioneer-platform/ccbot-coincap');
console.log(coincap)
const easterEggCommands  = require('@pioneer-platform/ccbot-easter-eggs');
let rebalance = require('@pioneer-platform/pioneer-rebalance')
const Accounting = require('@pioneer-platform/accounting')
const accounting = new Accounting(redis)

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
let wait = require('wait-promise');
let sleep = wait.sleep;


const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const { exec } = require('child_process');
//const AWS = require('aws-sdk');
const asciichart = require('asciichart');

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();

const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
let conversations = connection.get("conversations");
const knowledgeDB = connection.get('knowledge')
const rivescriptDB = connection.get('rivescriptRaw')
const skillsDB = connection.get('skills')
const tasksDB = connection.get('tasks')
const credentialsDB = connection.get('credentials')
let fs = require('fs')


interface Data {
    query: string
    queueId:string
    admin:boolean
    dm:boolean
    user:string
    username:string
    channel:string
    text:string
    discordName?:string
    discordId?:string
    sessionId?:string
    sessionInfo?:any
    messageId?:string
    output?:{
        views:any
        sentences:any
    }
}

interface Skill {
    inputs:any
    outputs:any
    script:string
    summary:string
    keywords:string[]
}

/***********************************************
 //        lib
 //***********************************************/
let push_sentence = async function(sentence:string,channel:any){
    let tag = TAG+ " | push_sentence | "
    try{
        //send to discord
        let payload = {
            channel,
            responses:{
                sentences:[sentence],
                views:[]
            }
        }
        publisher.publish('discord-bridge',JSON.stringify(payload))
        return true
    }catch(e){
        console.error(e)
    }
}

let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{

        let allWork = await queue.count("bots:"+BOT_NAME+":ingest")
        log.debug(tag,"allWork: ",allWork)

        work = await queue.getWork("bots:"+BOT_NAME+":ingest", 60)
        if(work){
            log.info("work: ",work)
            // if(!work.user) throw Error("101: invalid work! missing username")
            if(!work.taskId) throw Error("102: invalid work! missing taskId")
            if(!work.username) throw Error("102: invalid work! missing username")
            if(!work.channel) throw Error("103: invalid work! missing channel")
            if(!work.task) throw Error("103: invalid work! missing taskId")
            if(!work.result) throw Error("103: invalid work! missing result")

            //TODO get keywords from work
            log.info(tag,"work.taskId: ",work.taskId)
            //count chars in result

            //if needed recursively downsizes the input

            //ask bot if solved


            //pass back to delegation
            //release
            // redis.lpush(work.workId,JSON.stringify({success:true,solution:isSolved}))

        } else {
            log.debug(tag,"queue empty!")
        }

    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
        work.error = e.message
        queue.createWork("pioneer:pubkey:ingest:deadletter",work)
        //await sleep(10000)
    }
    //dont stop working even if error
    do_work()
}

//start working on install
log.info(TAG," worker started! ","")
do_work()
