/*
      CCbot

      generate response to input

      output:
        discord view

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
const coincap = require('@pioneer-platform/ccbot-coincap');

let rebalance = require('@pioneer-platform/pioneer-rebalance')
const Accounting = require('@pioneer-platform/accounting')
const accounting = new Accounting(redis)

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');


let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
let wait = require('wait-promise');
let sleep = wait.sleep;

let BOT_NAME = 'pioneer-exec-v1'
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY_4
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const { exec } = require('child_process');



const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
let conversations = connection.get("conversations");
const knowledgeDB = connection.get('knowledge')
const rivescriptDB = connection.get('rivescriptRaw')
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

/***********************************************
 //        lib
 //***********************************************/


const help = () => {
    return `
    ccbot help
`
}


let run_command = async function(skillId: string, inputs: any) {
    let tag = TAG + " | run_command | "
    try {
        //get script by id
        let command = await skillsDB.findOne({skillId})
        log.info(tag,"command: ",command)
        if(!command) throw Error("missing command "+skillId)

        //write script to file
        let writeSuccess = fs.writeFileSync('./run.sh', command.script);
        log.info(tag, "writeSuccess: ", writeSuccess)
        //make sure file is executable

        let messages = []
        let cmd = "sh run.sh";

        //for each input
        for(let i=0;i<inputs.length;i++){
            let input = inputs[i]
            log.info(tag,"input: ",input)
            cmd = cmd + ' "' + input+'"'
        }
        log.info(tag, "cmd: ", cmd)
        try {
            const TIMEOUT_MS = 60000; // 60 seconds

            const startTime = Date.now();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > TIMEOUT_MS) {
                throw new Error("Timeout: Script took too long to execute.");
            }

            let {stdout, stderr } = await util.promisify(exec)(cmd);
            log.info(tag, "stdout: ", stdout)
            log.info(tag, "stderr: ", stderr)

            if(stdout && stdout.length > 0 && stdout !== "null\\n"){
                log.info(tag, "Valid Execution: ", stdout)

                messages.push({
                    role: "assistant",
                    content: stdout
                })
            } else if(stderr){
                messages.push({
                    role: "user",
                    content: "that errored: error: " + stderr
                })
            } else if(stdout == "null\\n") {
                messages.push({
                    role: "user",
                    content: "that returned null, you should add error handling to the script"
                })
            } else {
                messages.push({
                    role: "user",
                    content: "something is wrong, not getting any good output"
                })
            }
        } catch(e){
            messages.push({
                role: "user",
                content: command
            })
        }



        return messages
    } catch(e) {
        console.error(e);
        throw e;
    }
}

/*
    analyze output
 */

const summarize_cli_result = async function(output:string){
    try{


        let messages = [
            {
                role:"system",
                content:"You are a cli processing bot. you process the data input filter out npm logs and return the output. this output is from bash output, and a node.js clis.  output will be json. and should be in a format {output:string}. you return a JSON string with the following fields {output:string,summary:string,success:boolean}. summary is a summary of all the npm logs and any critical errors"
            },
            {
                role:"user",
                content:output
            },
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
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}



/*
  do_work
 */
let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{

        let allWork = await queue.count("bots:"+BOT_NAME+":ingest")
        log.debug(tag,"allWork: ",allWork)

        work = await queue.getWork("bots:"+BOT_NAME+":ingest", 60)
        if(work){
            log.info("work: ",work)
            if(!work.skillId) throw Error("100: invalid work! missing work")
            if(!work.taskId) throw Error("100: invalid work! missing taskId")
            if(!work.inputCount) throw Error("100: invalid work! missing inputCount")
            if(!work.inputs) throw Error("100: invalid work! missing inputs")
            // if(!work.user) throw Error("101: invalid work! missing username")
            if(!work.username) throw Error("102: invalid work! missing username")
            if(!work.channel) throw Error("103: invalid work! missing channel")

            let result = await run_command(work.skillId, work.inputs)
            log.info("result: ",result)

            // //summarize
            // let summary = await summarize_cli_result(JSON.stringify(result))
            // log.info("summary: ",summary)
            // if(typeof(summary) === "string") summary = JSON.parse(summary)

            //save result to taskId
            let resultsSave = await tasksDB.update({taskId:work.taskId},{$set:{result}})
            log.info("resultsSave: ",resultsSave)

            //release
            redis.lpush(work.workId,JSON.stringify({success:true,result}))



            //push to discord
            // let message = {
            //     channel:work.channel,
            //     message:summary.output
            // }
            // let resultPublish = await publisher.publish('discord-bridge',JSON.stringify(message))
            // log.info("resultPublish: ",resultPublish)
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
