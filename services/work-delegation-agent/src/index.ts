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
let find_inputs = async function(inputs:any, task:string){
    let tag = TAG+ " | find_inputs | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a input finder bot. You review a task and provide a solution. the solution is a set of inputs into a executable script. inputs are an array of strings. the strings are the values passed to the exec."
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

//submit_solve_work
let submit_solve_work = async function(task:any){
    let tag = TAG+ " | submit_solve_work | "
    try{
        //if work is done attempt to execute
        let BOT_NAME = 'pioneer-solver-v1'
        let workExecute = {
            workId:short.generate(),
            taskId:task.taskId,
            username:task.username || 'ukn',
            discord:task.discord,
            discordId:task.discordId,
            channel:task.channel,
            userInfo:{},
            sessionId:task.sessionId,
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
        let solution = responseExecJson.solution
        log.info(tag,"solution: ",solution)

        if(solution && solution.solved && solution.solution){
            //mark task done

        }

        return solution
    }catch(e){
        console.error(e)
    }
}

//submit_exec_work
let submit_exec_work = async function(){
    let tag = TAG+ " | submit_exec_work | "
    try{

        return true
    }catch(e){
        console.error(e)
    }
}

//submit_skill_work
let submit_skill_work = async function(){
    let tag = TAG+ " | submit_skill_work | "
    try{

        return true
    }catch(e){
        console.error(e)
    }
}

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
    let work = {}
    try{

        //get queue length of exec engine
        //get queue length of skill engine

        //get all tasks from mongo
        let tasks = await tasksDB.find({complete:false})
        log.debug("tasks: ",tasks)

        //TODO iterate
        let task = tasks[0]
        if(task){
            //let credits for task
            let credits = await redis.hincrby(task.taskId,'credits',1)
            if(credits > 5){
                push_sentence("to many attempts! aborting task attempts:"+credits,task.channel)
                let taskUpdate = await tasksDB.update({taskId:task.taskId},{$set:{aborted:true}})
                log.info(tag,"taskUpdate: ",taskUpdate)

                let taskUpdate2 = await tasksDB.update({taskId:task.taskId},{$set:{complete:true}})
                log.info(tag,"taskUpdate2: ",taskUpdate2)

            } else {
                //if task has result send to solver
                if(task.result){
                    log.info(tag,"skill Result was found! attempt to solve")
                    //send to discord
                    push_sentence('result found for task: '+task.taskId+" sending to solver.",task.channel)
                    let solution = await submit_solve_work(task)
                    push_sentence(solution,task.channel)

                } else {
                    log.info(tag,"no skill performed! find a skill and perform")
                    //send to discord
                    push_sentence("no skill performed! finding a related skills",task.channel)
                    //if task has no result, attempt to solve

                    for(let i = 0; i < task.steps.length; i++){
                        let step = task.steps[i]
                        if(step.complete == true){
                            return
                        } else {
                            log.info(tag,"step: ",step)
                            push_sentence('Step:  '+step.action+' status: '+step.complete,task.channel)

                            //search skills related to task
                            //find related skills
                            let skillsRelated:any = []
                            for(let i = 0; i < task.keywords.length; i++){
                                let keyword = task.keywords[i]
                                let results = await skillsDB.find({keywords:{$all:[keyword]}})
                                skillsRelated = skillsRelated.concat(...skillsRelated,results)
                            }

                            //attempt full task solution
                            let solutions:any = []
                            if(skillsRelated && skillsRelated.length > 0){
                                //gather inputs
                                log.info(tag,"skillsRelated: ",skillsRelated)
                                let payloadResultSkills = {
                                    channel:task.channel,
                                    responses:{
                                        sentences:['found related skills  '+skillsRelated.length],
                                        views:[]
                                    }
                                }
                                publisher.publish('discord-bridge',JSON.stringify(payloadResultSkills))

                                for(let i = 0; i < skillsRelated.length; i++){
                                    let inputs = skillsRelated[i].inputs
                                    log.info(tag,"inputs: ",inputs)

                                    let solution = await find_inputs(inputs,task.summary)
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
                                    let payloadResultSkills = {
                                        channel:task.channel,
                                        responses:{
                                            sentences:['Attempting to execute skill:  '+solution.skillid],
                                            views:[]
                                        }
                                    }
                                    publisher.publish('discord-bridge',JSON.stringify(payloadResultSkills))

                                    let BOT_NAME = 'pioneer-exec-v1'
                                    let workExecute = {
                                        workId:short.generate(),
                                        taskId:task.taskId,
                                        username:task.username || 'ukn',
                                        discord:task.discord,
                                        discordId:task.discordId,
                                        channel:task.channel,
                                        userInfo:{},
                                        sessionId:task.sessionId,
                                        sessionInfo:{},
                                        userInfoPioneer:{},
                                        inputCount:solution.inputs.length,
                                        skillId:solution.skillid,
                                        inputs:solution.inputs,
                                    }

                                    queue.createWork("bots:"+BOT_NAME+":ingest",workExecute)

                                    let BLOCKING_TIMEOUT_INVOCATION_EXEC = 30000
                                    let responseExec = await redisQueue.blpop(workExecute.workId,BLOCKING_TIMEOUT_INVOCATION_EXEC)
                                    log.info(tag,"responseExec: ",responseExec)

                                    let skillOutput = JSON.parse(responseExec[1])
                                    log.info(tag,"skillOutput: ",skillOutput)

                                    //TODO update task with work done
                                    let taskUpdate = await tasksDB.update({taskId:task.taskId},{$set:{result:skillOutput}})
                                    log.info(tag,"taskUpdate: ",taskUpdate)

                                    //TODO verify solution is attached to task in mongo

                                    let BOT_NAME_SOLVER = 'pioneer-solver-v1'
                                    let workExecuteSolver = {
                                        workId:short.generate(),
                                        taskId:task.taskId,
                                        username:task.username || 'ukn',
                                        discord:task.discord,
                                        discordId:task.discordId,
                                        channel:task.channel,
                                        userInfo:{},
                                        sessionId:task.sessionId,
                                        sessionInfo:{},
                                        userInfoPioneer:{},
                                        inputCount:1,
                                        task,
                                        result:skillOutput.result
                                    }
                                    queue.createWork("bots:"+BOT_NAME_SOLVER+":ingest",workExecuteSolver)

                                }
                                //
                            } else {
                                //to related skills
                                let WORKER_NAME = 'pioneer-skills-creator'
                                let workCreate = {
                                    workId:short.generate(),
                                    username:task.username || 'ukn',
                                    discord:task.discord ,
                                    channel:task.channel,
                                    userInfo:{},
                                    sessionId:task.sessionId,
                                    sessionInfo:{},
                                    userInfoPioneer:{},
                                    inputsCount:1,
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
                        return
                    } // end steps
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
