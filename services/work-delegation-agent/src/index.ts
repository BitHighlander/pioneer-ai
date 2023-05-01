/*
        Pioneer Task Delegation

        1. Receive a task from a user

        attempt steps in order

        loop
            create skill

            test skill

            if fail, create new skill with learned improvements


        if fail after x attempts abort and return error

 */

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

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');


let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
let wait = require('wait-promise');
let sleep = wait.sleep;

let BOT_NAME = process.env['BOT_NAME'] || 'pioneer-task-queue'
console.log("USING USE_GPT_4")
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY_4
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
// const rivescriptDB = connection.get('rivescriptRaw')
const skillsDB = connection.get('skills')
const tasksDB = connection.get('tasks')
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
    userInfo?:any
    discordName?:string
    discordId?:string
    sessionId?:string
    sessionInfo?:any
    messageId?:string
    userInfoPioneer?:any
    output?:{
        views:any
        sentences:any
    }
}

/***********************************************
//        lib
//***********************************************/


const help = () => {
    return `
    ccbot help
`
}



let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work = {}
    try{

        //get queue length of exec engine
        //get queue length of skill engine

        //get all tasks from mongo
        let tasks = await tasksDB.find({complete:false})

        log.info("tasks: ",tasks)

        //TODO iterate
        let task = tasks[0]

        //Get next step in task, assign work
        let taskAssigned = false

        for(let i = 0; i < task.steps.length; i++){

            let step = task.steps[i]
            log.info(tag,"step: ",step)
            //TODO validate step

            if(!taskAssigned && step.complete == false){
                taskAssigned = true

                //if credits on task
                    //continue

                //if attempts
                    //if attempts !scored, score
                        //

                let WORKER_NAME = 'pioneer-skills-creator'
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
                log.info(tag,"creating work!")
                queue.createWork("bots:"+WORKER_NAME+":ingest",work)
            }

        }



    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
        // @ts-ignore
        work.error = e.message
        queue.createWork("pioneer:pubkey:ingest:deadletter",work)
        //await sleep(10000)
    }
    //await sleep(1000)
    //dont stop working even if error
    //do_work()
}

//start working on install
log.info(TAG," worker started! ","")
do_work()
