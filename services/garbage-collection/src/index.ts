/*
      Garbage collection

        @TODO

        intake raw messages from discord

        digest into knowledge

        store knowledge

        clean up discord messages

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

let rive = require('@pioneer-platform/ccbot-rivescript-brain')
//onStart
rive.initialize()

interface Data {
    query: string
    // queueId:string
    // admin:boolean
    // dm:boolean
    // user:string
    // username:string
    // channel:string
    // text:string
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
    let work
    try{

        //get data from raw queue


    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
        queue.createWork("pioneer:pubkey:ingest:deadletter",work)
        //await sleep(10000)
    }
    //dont stop working even if error
    do_work()
}

//start working on install
log.info(TAG," worker started! ","")
do_work()
