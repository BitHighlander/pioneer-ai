/*
        Pioneer Task Worker

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

const build_summary = async function(input:string, sessionInfo:any){
    let tag = TAG + " | build_summary | "
    try{

        let messages = [
            {
                role:"system",
                content:"summarize the text input. determine if they are asking for live data. return a json object with the struct { summary: string, externalQuery: string, needsExternal: boolean, keywords: string[] }"
            },
        ]

        //session
        for(let i = 0; i < sessionInfo.length; i++){
            let messageInfo = sessionInfo[i]
            log.debug(tag,"messageInfo: ",messageInfo)
            if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
                log.debug(tag," I think the session is valid! ")
                log.debug(tag,"messageInfo.username: ",messageInfo.username)
                log.debug(tag,"messageInfo.output: ",messageInfo.output)
                messages.push({
                    role:"user",
                    content: messageInfo.text
                })
                messages.push({
                    role:"assistant",
                    content: messageInfo.output.sentences.toString()
                })
            } else {
                log.error(tag,"invalid messageInfo: ",messageInfo)
            }
        }
        messages.push({ role: 'user', content:  input })

        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        console.log("response: ",response.data.choices[0])
        console.log("response: ",response.data.choices[0].message.content)
        return JSON.parse(response.data.choices[0].message.content)
    }catch(e){
        console.error(e)
    }
}

const build_work = async function(data:any, summary:any){
    let tag = TAG + " | build_work | "
    try{

        let messages = [
            {
                role:"system",
                content:"analyze the requested task, break it down into small steps for a process worker. each step should be specific and achievable with a single api request or script processing the data. You always are prepaired for changes in the returned data and never assume you know how data will be formed, you create scripts that review returned data and find what you are looking for and confirm its correct."
            },
            {
                role:"system",
                content:"The output will go to JSON.stringify, verify the output is valid and parseable. never add ..., never cuttoff entries. return a json object with the struct { summary: string, keywords:string[] finalGoal: string, steps: steps: steps:[{ type:string, input: string, action:string  }] }"
            },
            {
                role:"user",
                content:data.text
            },
            {
                role:"assistant",
                content:"summary: "+JSON.stringify(summary)
            }
        ]

        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        console.log("response: ",response.data.choices[0])
        console.log("response: ",response.data.choices[0].message.content)
        return JSON.parse(response.data.choices[0].message.content)
    }catch(e){
        console.error(e)
    }
}

//test
let build_solution = async function(task:any){
    let tag = TAG+ " | build_solution | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a solver bot. You review a task and solve it"
            },
            {
                role:"user",
                content:"the task im trying to solve is "+JSON.stringify(task)
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}


const deliberate_on_input = async function(session:any,data:Data,username:string){
    const tag = " | deliberate_on_input | "
    try{
        //let isSolved
        let isSolved = false
        let output:any = {}
        output.views = []
        output.sentences = []
        log.info(tag,"session: ",session)
        log.info(tag,"data: ",data)
        log.info(tag,"text: ",data.text)
        // log.info(tag,"username: ",username)
        // log.info(tag,"data: ",data.text)

        let background = []
        let commands = []
        //Summarize
        let summary = await build_summary(data.text, data.sessionInfo)
        log.info(tag,"summary: ",summary)
        let message = {
            channel:data.channel,
            responses:{
                views:[],
                sentences:["summary: "+summary.summary]
            }
        }
        log.info("message: ",message)
        let resultPublish = await publisher.publish('discord-bridge',JSON.stringify(message))
        log.info("resultPublish: ",resultPublish)


        if(summary.needsExternal){
            log.info(tag,"summary: ",summary)
            let messageNeedsExternal = {
                channel:data.channel,
                responses:{
                    views:[],
                    sentences:["needsExternal: "+summary.needsExternal]
                }
            }
            await publisher.publish('discord-bridge',JSON.stringify(messageNeedsExternal))


            let workResp = await build_work(data, summary)
            log.info(tag,"workResp: ",workResp)
            // create taskId
            let taskId = short.generate()
            //checkpoint display to discord
            let view = {
                type:"task",
                data:workResp,
                message:taskId
            }
            //push to discord
            if(!data.channel) throw Error("Missing Channel")
            let message = {
                channel:data.channel,
                responses:{
                    views:[view],
                    sentences:[]
                }
            }
            log.info("message: ",message)
            let resultPublish = await publisher.publish('discord-bridge',JSON.stringify(message))
            log.info("resultPublish: ",resultPublish)

            //for each task
            for(let i = 0; i < workResp.steps.length; i++){
                workResp.steps[i].taskId = taskId
                workResp.steps[i].complete = false
            }
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
            let savedTask = await tasksDB.insert(task)
            log.info(tag,"savedTask: ",savedTask)
        } else {
            log.info("Does not need external data, solve it now")
            let solution = await build_solution(data.text)
            log.info(tag,"solution: ",solution)
            //
            let message = {
                channel:data.channel,
                responses:{
                    views:[],
                    sentences:[solution]
                }
            }
            log.info("message: ",message)
            let resultPublish = await publisher.publish('discord-bridge',JSON.stringify(message))
        }

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

        work = await queue.getWork("bots:"+BOT_NAME+":ingest", 5)
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

            //push
            // let event = {
            //     type:'update',
            //     username:work.username,
            //     response:{
            //         text:JSON.stringify(response.sentences)
            //     }
            // }
            // let result = await publisher.publish('pioneer',JSON.stringify(event))
            // console.log(result)
            //
            // //release
            // let timeRelease = new Date().getTime()
            // let duration = timeRelease - timeReceive
            //
            // redis.lpush(work.queueId,JSON.stringify(response))

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

//start working on install
log.info(TAG," worker started! ","")
do_work()
