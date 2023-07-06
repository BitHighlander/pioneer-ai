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
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
console.log("OPENAI_API_KEY: ",OPENAI_API_KEY)
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const { exec } = require('child_process');
//const AWS = require('aws-sdk');
const asciichart = require('asciichart');

const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
let conversations = connection.get("conversations");
const knowledgeDB = connection.get('knowledge')
// const rivescriptDB = connection.get('rivescriptRaw')
const skillsDB = connection.get('skills')
const tasksDB = connection.get('tasks')
let fs = require('fs')
let ai = require('@pioneer-platform/pioneer-intelligence')

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
let submit_exec_work = async function(task:any,skill:any,inputs:any){
    let tag = TAG+ " | submit_exec_work | "
    try{
        if(!inputs) throw Error("missing inputs")
        if(!skill) throw Error("missing skill")
        if(!task) throw Error("missing task")
        if(!skill.skillId) throw Error("missing skillid")
        if(!task.taskId) throw Error("missing taskId")

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
            inputCount:inputs.length,
            skillId:skill.skillId,
            inputs:inputs,
        }
        queue.createWork("bots:"+BOT_NAME+":ingest",workExecute)
        return true
    }catch(e){
        console.error(e)
    }
}

//submit_skill_work
let submit_skill_creator = async function(task:any,step:any){
    let tag = TAG+ " | submit_skill_creator | "
    try{
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

/*
        //Shotgun algo modal

        //get all related skills

        //create 5 new skills

        //perform 5 tasks

        //aggregate 5 results

        //score results

        //pick best result

 */
let build_work_load = async function(task:any,skills:any){
    let tag = TAG+" | build_work_load | "
    try{
        //create 5 new skills
        let newSkill:any = []
        for(let i = 0; i < task.steps.length; i++){
            let step = task.steps[i]
            log.info(tag,"step: ",step)
        }

    } catch(e) {
        log.error(tag,"e: ",e)
    }
}

let solver = async function(task:any){
    let tag = TAG+" | solver | "
    try{
        //
        //send to discord
        //if task has no result, attempt to solve

        //skills related to keywords
        let skillsRelated:any = []
        for(let i = 0; i < task.keywords.length; i++){
            let keyword = task.keywords[i]
            let results = await skillsDB.find({keywords:{$all:[keyword]}})
            skillsRelated = skillsRelated.concat(...skillsRelated,results)
        }

        //get all related knowledge from db

        //write to file

        //load into db

        //query for related knowledge

        //TODO Can I solve with the following skills?

        //do I need to create a new skill?

        //do I need to create a playbook of multiple skills?

        // build_work_load(task,skillsRelated)

        for(let i = 0; i < task.steps.length; i++){
            let step = task.steps[i]
            log.info(tag,"step: ",step)
            if(step.complete == true){
                log.info(tag,"step already complete! skipping")
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
                let performedSkills:any = task.performedSkills || []
                if(skillsRelated && skillsRelated.length > 0){
                    //gather inputs
                    log.info(tag,"skillsRelated: ",skillsRelated)

                    for(let i = 0; i < skillsRelated.length; i++){
                        let skill = skillsRelated[i]
                        log.info(tag,"skill: ",skill)
                        //if skill is not performed
                        if(performedSkills.indexOf(skill.skillId) == -1){
                            //perform skill
                            push_sentence('found related skill  '+skill.skillId,task.channel)
                            //calculate inputs
                            let inputsTemplate = skill.inputs
                            log.info(tag,"inputsTemplate: ",inputsTemplate)
                            log.info(tag,"task: ",task)
                            let inputs = await ai.findInputs(skill,task)
                            // if(inputs.length > inputsTemplate.length) throw Error("ERROR too many inputs found! bad input object")
                            // if(inputs.length !== inputsTemplate.length) throw Error("ERROR incorrect inputs! array length mismatch")
                            log.info(tag,"inputs: ",inputs)

                            //TODO handle the breakdown if multiple inputs are needed per skill
                            //for each input, make separate query
                            for(let i = 0; i < inputs.length; i++){
                                let inputsSkill = inputs[i]
                                inputsSkill = [inputsSkill]
                                //TODO make this a view
                                push_sentence('Attempting to execute skill:  '+skill.skillId + " with inputs: "+JSON.stringify(inputsSkill),task.channel)
                                submit_exec_work(task,skill,inputs)
                            }
                        } else {
                            push_sentence('Already Attempted skill  '+skill.skillId,task.channel)
                        }
                    }
                } else {
                    push_sentence('No related Skills found! create new skill  ',task.channel)
                    submit_skill_creator(task,step)
                }
            }
            return
        } // end steps
    } catch(e) {
        log.error(tag,"e: ",e)
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
            push_sentence('credits:  '+credits,task.channel)

            if(credits > 10){
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
                    log.info(tag,"no skill performed! find a skill to perform on first step")
                    push_sentence("no skill performed! finding a related skills",task.channel)

                    solver(task)
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
    // //TODO loop
    // await sleep(5000)
    // //dont stop working even if error
    // do_work()
}

//start working on install
log.info(TAG," worker started! ","")
do_work()
// setInterval(do_work,5000)
