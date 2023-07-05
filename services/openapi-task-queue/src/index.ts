/*
        Pioneer Task Worker

 */

require('dotenv').config()
require('dotenv').config({path:"./../.env"})
require('dotenv').config({path:"./../../.env"})
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

let ai = require('@pioneer-platform/pioneer-intelligence')
ai.init(process.env['OPENAI_API_KEY'])

let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
const knowledgeDB = connection.get('knowledge');
knowledgeDB.createIndex({title: 1}, {unique: true})
let wait = require('wait-promise');
let sleep = wait.sleep;

let brain = require('@pioneer-platform/langchain')

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();

const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
let conversations = connection.get("conversations");

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

let push_view = async function(task:any,channel:any){
    let tag = TAG+ " | push_sentence | "
    try{
        let view = {
            type:"task",
            data:task,
            message:task.taskId
        }

        //send to discord
        let payload = {
            channel,
            responses:{
                sentences:[],
                views:[view]
            }
        }
        publisher.publish('discord-bridge',JSON.stringify(payload))
        return true
    }catch(e){
        console.error(e)
    }
}

// const add_knowledge = async function(input:string, data:any){
//     try{
//         //TODO make smart query
//         let context = await brain.query(input)
//         console.log("context: ",context)
//         push_sentence("background knowledge: "+context.text,data.channel)
//
//         //attach to
//         return context
//     }catch(e){
//         console.error(e)
//     }
// }

const deliberate_on_input = async function(session:any,data:Data,username:string){
    const tag = " | deliberate_on_input | "
    try{
        if(!data.channel) throw Error("Missing data.channel")
        let output:any = {}
        output.views = []
        output.sentences = []
        //get keywords

        //Summarize
        let summary = await ai.buildSummary(data.text, data.sessionInfo, {})
        if(!summary) throw Error("Missing Summary")
        log.info(tag,"summary: ",summary)
        if(!summary.summary) throw Error("Missing Summary.summary")
        push_sentence("summary: "+summary.summary,data.channel)

        //is solved
        if(summary.isSolved){
            push_sentence("isSolved: "+summary.isSolved,data.channel)
            push_sentence("solution: "+summary.solution,data.channel)
            return true
        } else if(summary.needsExternal){
            push_sentence("needsExternal: "+summary.needsExternal,data.channel)
            push_sentence("Sending to Intelligence TASK engine. this will be slow ",data.channel)


            // let workResp = await build_work(data, summary)
            let workResp = await ai.buildTask(summary)
            log.info(tag,"workResp: ",workResp)
            if(!workResp) throw Error("Missing workResp")
            if(!workResp.summary) throw Error("Missing workResp.summary")
            if(!workResp.finalGoal) throw Error("Missing workResp.finalGoal")
            if(!workResp.keywords) throw Error("Missing workResp.keywords")
            if(!workResp.steps) throw Error("Missing workResp.steps")

            //verify all the steps are complete:false
            for(let i = 0; i < workResp.steps.length; i++){
                let step = workResp.steps[i]
                if(step.complete){
                    workResp.steps[i].complete = false
                }
            }

            // create taskId
            let taskId = short.generate()
            let task = {
                taskId,
                discordId:data.discordId,
                sessionId:data.sessionId,
                channel:data.channel,
                owner:data.username,
                keywords:summary.keywords,
                summary:workResp.summary,
                finalGoal:workResp.finalGoal,
                steps:workResp.steps,
                complete:false,
                priority:10
            }
            //checkpoint display to discord
            push_view(task,data.channel)

            let savedTask = await tasksDB.insert(task)
            log.info(tag,"savedTask: ",savedTask)
        }

        if(summary.needsExternal || summary.needsExecution || true){
            push_sentence("needsExternal: "+summary.needsExternal,data.channel)

            // let workResp = await build_work(data, summary)
            let workResp = await ai.buildTask(summary)
            log.info(tag,"workResp: ",workResp)
            if(!workResp) throw Error("Missing workResp")
            if(!workResp.summary) throw Error("Missing workResp.summary")
            if(!workResp.finalGoal) throw Error("Missing workResp.finalGoal")
            if(!workResp.keywords) throw Error("Missing workResp.keywords")
            if(!workResp.steps) throw Error("Missing workResp.steps")

            //verify all the steps are complete:false
            for(let i = 0; i < workResp.steps.length; i++){
                let step = workResp.steps[i]
                if(step.complete){
                    workResp.steps[i].complete = false
                }
            }

            // create taskId
            let taskId = short.generate()
            //TODO hack removeme
            summary.keywords.push('search')
            let task = {
                taskId,
                discordId:data.discordId,
                sessionId:data.sessionId,
                channel:data.channel,
                owner:data.username,
                keywords:summary.keywords,
                summary:workResp.summary,
                finalGoal:workResp.finalGoal,
                steps:workResp.steps,
                complete:false,
                priority:10
            }
            //checkpoint display to discord
            push_view(task,data.channel)

            let savedTask = await tasksDB.insert(task)
            log.info(tag,"savedTask: ",savedTask)
        } else {
            log.info(tag,"Does not need external data, solve it now")
            // let solution = await build_solution(data.text)
            let solution = await ai.buildSolution(data.text)
            log.info(tag,"solution: ",solution)
            push_sentence("solution: "+JSON.stringify(solution),data.channel)
        }

    }catch(e){
        console.error(e)
    }
}


let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{

        let allWork = await queue.count("bots:pioneer-task-queue:ingest")
        log.debug(tag,"allWork: ",allWork)

        work = await queue.getWork("bots:pioneer-task-queue:ingest", 5)
        if(work){
            log.info("work: ",work)
            if(!work.text) throw Error("100: invalid work! missing text")
            // if(!work.user) throw Error("101: invalid work! missing username")
            if(!work.username) throw Error("102: invalid work! missing username")
            if(!work.channel) throw Error("103: invalid work! missing channel")

            //receive
            let timeReceive = new Date().getTime()
            //parse tokens
            let session = 'discord'
            let response = await deliberate_on_input(session,work,work.username)
            log.info(tag,"response: ",response)

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
    await sleep(1000)
    //dont stop working even if error
    do_work()
}

let onStart = async function(){
    try{
        do_work()
    }catch(e){
        log.error(e)
    }
}

//subscribe to bot events
//sub to redis for push messages
subscriber.subscribe('pioneer-brain')
subscriber.on('message', async function (channel:string, payloadS:string) {
    let tag = TAG + ' | pioneer-brain | ';
    try {
        log.info(tag,channel+ " event: ",payloadS)

        //load new data into brain

    } catch (e) {
        log.error(tag, e);
        //throw e
    }
});

//start working on install
log.info(TAG," worker started! ","")
onStart()
