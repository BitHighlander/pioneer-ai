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

const log = require('@pioneer-platform/loggerdog')()
const {subscriber,publisher,redis,redisQueue} = require('@pioneer-platform/default-redis')

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

let BOT_NAME = process.env['BOT_NAME'] || 'pioneer'
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//const AWS = require('aws-sdk');
const asciichart = require('asciichart');

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();

const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
let conversations = connection.get("conversations");

let rive = require('@pioneer-platform/ccbot-rivescript-brain')
//onStart
rive.initialize()

interface Data {
    query: string
    queueId:string
    admin:boolean
    dm:boolean
    user:string
    username:string
    channel:string
    text:string
}

/***********************************************
 //        lib
 //***********************************************/


const help = () => {
    return `
    ccbot help
`
}

const deliberate_on_input = async function(session:any,data:Data,username:string){
    const tag = " | deliberate_on_input | "
    try{
        let output:any = {}
        output.views = []
        output.sentences = []
        log.info(tag,"session: ",session)
        log.info(tag,"data: ",data)
        log.info(tag,"query: ",data.query)
        // log.info(tag,"username: ",username)
        // log.info(tag,"data: ",data.text)

        let body = {
            model: "text-davinci-003",
            prompt: data.query+"\n\n",
            temperature: 0.7,
            max_tokens: 756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        }

        const response = await openai.createCompletion(body);
        // console.log("response: ",response)
        // console.log("response: ",response.data)
        // console.log("response: ",response.data.choices)
        // console.log("response: ",response.data.choices[0])
        output.sentences = response.data.choices[0].text


        return output
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
            if(!work.text) throw Error("100: invalid work! missing query")
            // if(!work.user) throw Error("101: invalid work! missing username")
            if(!work.username) throw Error("102: invalid work! missing username")
            // if(!work.text) throw Error("103: invalid work! missing text")

            //receive
            let timeReceive = new Date().getTime()
            //parse tokens
            let session = 'discord'
            let response = await deliberate_on_input(session,work,work.username)
            log.info(tag,"response: ",response)

            //push
            let event = {
                type:'update',
                username:work.username,
                response:{
                    text:JSON.stringify(response.sentences)
                }
            }
            let result = await publisher.publish('pioneer',JSON.stringify(event))
            console.log(result)

            //release
            let timeRelease = new Date().getTime()
            let duration = timeRelease - timeReceive

            redis.lpush(work.queueId,JSON.stringify(response))
        } else {
            log.info(tag,"queue empty!")
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
