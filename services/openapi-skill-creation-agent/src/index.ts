/*
      Skills creation worker

 */

let BOT_NAME = 'pioneer-skills-creator'
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
const rivescriptDB = connection.get('rivescriptRaw')
const skillsDB = connection.get('skills')
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

const save_skill = async function(skill:Skill){
    let tag = TAG+" | save_skill | "
    try{
        let skillId = "CMD:0.0.1:" + short.generate();

        //readfile
        let script = fs.readFileSync('./run.sh', 'utf8');
        log.info("script: ",script)

        let entry = {
            created: new Date().getTime(),
            skillId,
            script:skill.script,
            description:skill.summary,
            keywords:skill.keywords
        }
        log.info("entry: ",entry)
        //save to db
        let saved = await skillsDB.insert(entry)
        log.info("saved: ",saved)
        return entry
    }catch(e){
        console.error(e)
        throw e
    }
}

//write
/*
    Build a script
 */

const build_a_script = async function(output:string){
    try{
        log.info("build_a_script checkpoint : ",output)

        let messages = [
            {
                role:"system",
                content:"You are a skills creation bot. you write bash scripts that wrap clis. you find common CLIs that does usefull things and wrap them in bash scripts that format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself. to the output of the bash scripts is always in the following json format {success:boolean,output:string,summary:string}"
            },
            {
                role:"system",
                content:"you always output in the following format {script:string,inputs:any,outputs:any,summary:string,keywords:string[]}"
            },
            {
                role:"system",
                content:" you never attach any extra characters or words. you never say result:  Here's a bash script that... you only output the json outputs, you review the script to verify it will parse to json closely. if needed you will escape ticks in the bash script to make sure it parses json via JSON.parse correctly. you never forget to put a shabam at the top of the bash script. or words around the output. it is pure stringified json. the script field of the output must be a stringified version of a bash script. of there are any install commands needed you must add them inside the bash script."
            },
            {
                role:"system",
                content:"Bash Scripts are always written for MacOS"
            },
            {
                role:"user",
                content:output
            }
        ]
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        // console.log("response: ",response.data.choices[0])
        // console.log("response: ",response.data.choices[0].message.content)
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}


//test

//save


let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{

        let allWork = await queue.count("bots:"+BOT_NAME+":ingest")
        log.debug(tag,"allWork: ",allWork)

        work = await queue.getWork("bots:"+BOT_NAME+":ingest", 60)
        if(work){
            log.info("work: ",work)
            if(!work.work) throw Error("100: invalid work! missing work")
            // if(!work.user) throw Error("101: invalid work! missing username")
            if(!work.username) throw Error("102: invalid work! missing username")
            if(!work.channel) throw Error("103: invalid work! missing channel")

            //build scripts from inputted code examples
            let result = await build_a_script(work.work)
            log.info("result: ",result)

            //verify output is json
            let resultFormated = JSON.parse(result)
            //verify json is correct format
            // if(!resultFormated.inputs) throw Error("Invalid output! missing inputs")
            if(!resultFormated.script) throw Error("Invalid output! missing script")
            if(!resultFormated.summary) throw Error("Invalid output! missing summary")
            if(!resultFormated.keywords) throw Error("Invalid output! missing keywords")


            //save skill
            let saveSuccess = await save_skill(resultFormated)
            log.info(tag,"saveSuccess: ",saveSuccess)
            if(!saveSuccess.skillId) throw Error("Failed to save Skill!")
            //submit skill to execution engine
            let WORKER_NAME = 'pioneer-exec-v1'
            let workExe = {
                username:work.username,
                discord:work.discord,
                discordId:work.discordId,
                channel:work.channel,
                userInfo:work.userInfo,
                sessionId:work.sessionId,
                sessionInfo:work.sessionInfo,
                userInfoPioneer:work.userInfoPioneer,
                work:saveSuccess.skillId,
                text:saveSuccess.skillId
            }
            queue.createWork("bots:"+WORKER_NAME+":ingest",workExe)
            //verify results

            //is skill passes mark it

            //if it fails mark it

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
