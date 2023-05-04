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

//test
let build_solution = async function(inputs:any, task:string){
    let tag = TAG+ " | build_solution | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a solutions bot. You review a task and provide a solution. the solution is a set of inputs into a executable script. inputs are an array of strings. the strings are the values passed to the exec."
            },
            {
                role:"system",
                content:'you always output in the following JSON stringifies format { "inputs": string[]}'
            },
            {
                role:"user",
                content:"inputs the the skill needed: "+JSON.stringify(inputs)+" and the task im trying to solve is "+task+" build a set of inputs that will solve this task"
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
        if(task){
            //Get next step in task, assign work
            let taskAssigned = false

            //if task has result send to solver
            if(task.result){
                log.info(tag,"Result was found! send to solver")
                log.info(tag,"task.result: ",task.result)

                //if work is done attempt to execute
                let BOT_NAME = 'pioneer-solver-v1'
                let workExecute = {
                    workId:short.generate(),
                    taskId:task.taskId,
                    username:"test123",
                    discord:"",
                    discordId:"",
                    channel:"234234232",
                    userInfo:{},
                    sessionId:"123123123",
                    sessionInfo:{},
                    userInfoPioneer:{},
                    inputCount:1,
                    task,
                    result:task.result
                }

                queue.createWork("bots:"+BOT_NAME+":ingest",workExecute)

                let BLOCKING_TIMEOUT_INVOCATION_EXEC = 30000
                let responseExec = await redisQueue.blpop(workExecute.workId,BLOCKING_TIMEOUT_INVOCATION_EXEC)
                log.info(tag,"responseExec: ",responseExec)

                let responseExecJson = JSON.parse(responseExec[1])
                responseExecJson = JSON.parse(responseExecJson)
                let solution = responseExecJson.solution
                log.info(tag,"solution: ",solution)

                //send to discord
                let payload = {
                    channel:"1090511307524034642",
                    responses:{
                        sentences:[solution],
                        views:[]
                    }
                }
                publisher.publish('discord-bridge',JSON.stringify(payload))

            } else {
                log.info(tag,"Not solved!")
                //if task has no result, attempt to solve

                for(let i = 0; i < task.steps.length; i++){

                    let step = task.steps[i]
                    log.info(tag,"step: ",step)
                    //TODO validate step

                    //review task

                    //search skills related to task
                    //find related skills
                    let skillsRelated:any = []
                    for(let i = 0; i < task.keywords.length; i++){
                        let keyword = task.keywords[i]
                        let results = await skillsDB.find({keywords:{$all:[keyword]}})
                        skillsRelated = skillsRelated.concat(...skillsRelated,results)
                    }
                    log.info(tag,"skillsRelated: ",skillsRelated)

                    //attempt full task solution
                    let solutions:any = []
                    if(skillsRelated && skillsRelated.length > 0){
                        //gather inputs

                        for(let i = 0; i < skillsRelated.length; i++){
                            let inputs = skillsRelated[i].inputs
                            log.info(tag,"inputs: ",inputs)

                            let solution = await build_solution(inputs,task.summary)
                            log.info(tag,"solution1: ",solution)
                            solution = JSON.parse(solution)
                            log.info(tag,"solution2: ",solution)
                            solution.skillid = skillsRelated[i].skillId
                            log.info(tag,"solution3: ",solution)
                            solutions.push(solution)
                        }

                        //attempt all the solutions
                        for(i = 0; i < solutions.length; i++){
                            let solution = solutions[i]
                            log.info(tag,"solution4: ",solution)
                            log.info(tag,"solution5: ",solution.inputs)
                            //if work is done attempt to execute
                            let BOT_NAME = 'pioneer-exec-v1'
                            let workExecute = {
                                workId:short.generate(),
                                taskId:task.taskId,
                                username:"test123",
                                discord:"",
                                discordId:"",
                                channel:"234234232",
                                userInfo:{},
                                sessionId:"123123123",
                                sessionInfo:{},
                                userInfoPioneer:{},
                                inputCount:1,
                                skillId:solution.skillid,
                                inputs:solution.inputs,
                            }

                            queue.createWork("bots:"+BOT_NAME+":ingest",workExecute)

                            let BLOCKING_TIMEOUT_INVOCATION_EXEC = 30000
                            let responseExec = await redisQueue.blpop(workExecute.workId,BLOCKING_TIMEOUT_INVOCATION_EXEC)
                            log.info(tag,"responseExec: ",responseExec)

                        }
                        //
                    } else {
                        //to related skills
                        let WORKER_NAME = 'pioneer-skills-creator'
                        let workCreate = {
                            workId:short.generate(),
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
                        queue.createWork("bots:"+WORKER_NAME+":ingest",workCreate)

                        let BLOCKING_TIMEOUT_INVOCATION = 30000
                        let response = await redisQueue.blpop(workCreate.workId,BLOCKING_TIMEOUT_INVOCATION)
                        log.info(tag,"response: ",response)
                        let responseForamted = JSON.parse(response)
                        log.info(tag,"response: ",responseForamted)
                        let skillId = responseForamted.skillId

                        //TODO Validate response

                        //get skill from mongo
                        let skillInfo = await skillsDB.find({skillId:skillId})
                        log.info(tag,"skillInfo: ",skillInfo)
                    }
                }
            }
        } else {
            log.info(tag,"No tasks found!")
        }




    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
        // @ts-ignore
        work.error = e.message
        queue.createWork("pioneer:pubkey:ingest:deadletter",work)
        //await sleep(10000)
    }
    await sleep(5000)
    //dont stop working even if error
    do_work()
}

//start working on install
log.info(TAG," worker started! ","")
do_work()
