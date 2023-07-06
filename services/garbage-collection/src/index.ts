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
const Pioneer = require("@pioneer-platform/pioneer-client").default;

let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
let wait = require('wait-promise');
let sleep = wait.sleep;

let BOT_NAME = process.env['BOT_NAME'] || 'pioneer'
const { Configuration, OpenAIApi } = require("openai");
let ai = require('@pioneer-platform/pioneer-intelligence')
ai.init({})

//const AWS = require('aws-sdk');
const asciichart = require('asciichart');

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();

const usersDB = connection.get('usersCCbot')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({user: 1}, {unique: true})
const conversations = connection.get("conversations");
const knowledgeDB = connection.get('knowledge')
const skillsDB = connection.get('skills')
const discordRawDB = connection.get('discordRaw')
const tasksDB = connection.get('tasks')

let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
const config = {
    queryKey: process.env['QUERY_KEY'] || 'gc-pioneer-ai',
};
/***********************************************
 //        lib
 //***********************************************/

/*
    Higher functions
        Sensory input

        Listen to discord

        listen to github

        subscribe to twitter

    have a higher purpose

    make decisions

    improve itself

 */

//clean discord messages
let do_work_discord = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{
        let CHUNK_SIZE = 10000
        //intake collected data

        //process and refine data into skills

        //remove spam and low value data

        //get data from raw queue

        //review tasks
        // let tasks = await tasksDB.find({},{limit:CHUNK_SIZE})
        let tasks = await discordRawDB.find({},{limit:CHUNK_SIZE})
        //log.info(tag,"tasks: ",tasks)

        //bundle content and look for topics
        let rawData = ""
        for(let i = 0; i < tasks.length; i++){
            let text = tasks[i].text
            if(text)rawData += text
        }
        log.info(tag,"rawData: ",rawData)
        log.info(tag,"rawData: ",rawData.length)

        //chunks of 2k chars
        // Chunks of 20,000 chars
        const CHUNK_SIZE_AI = 10000;
        const chunks = [];
        for (let i = 0; i < rawData.length; i += CHUNK_SIZE_AI) {
            chunks.push(rawData.substr(i, CHUNK_SIZE_AI));
        }

        // Summarize topics
        let schema = {
            topics: "array of topics of content",
            summary: "a summary of the content",
            insights: "give interesting insights to the content",
            quality:
                "1 - 10 of content, is it relevant to topics, is it spam, is it noise",
            content:
                "filtered content, a raw output of all the content condensed and removed of noise designed for saving a loading to a pinecone db later",
        };
        let objective =
            "DO NOT ADD CONTENT< DO NOT IMAGINE CONTENT< DO NOT HALLUCINATE ONLY FILTER GIVEN CONTENT, Parse these raw discord logs and find topics and filter out noise and chatbot responses: I only want non-ai content "

        let allData = []
        let allTopics: any[] = []
        for (let i = 0; i < chunks.length; i++) {
            let result = await ai.analyzeData({data:chunks[i]},objective, schema);
            log.info(tag, "result: ", result);
            allData.push(result)
            allTopics = allTopics.concat(result.topics)
        }

        let knowledgeBlock = {
            title:"Discord:raw:ingest" + new Date().getTime(),
            topics:allTopics,
            data: allData
        }

        //save to knowledge
        log.info(tag,"knowledgeBlock: ",knowledgeBlock)
        await knowledgeDB.insert(knowledgeBlock)
    } catch(e) {
        log.error(tag,"e: ",e)
        log.error(tag,"e: ",e.message)
        queue.createWork("pioneer:pubkey:ingest:deadletter",work)
        //await sleep(10000)
    }
    //dont stop working even if error
    //do_work()
}

//exmplore uncharted data
let do_work_explore = async function(){
    let tag = TAG + " | do_work_explore | "
    try{
        let pioneer = new Pioneer(spec, config);
        pioneer = await pioneer.init();
        //get random charting

        let task = await pioneer.RandomCharting();
        log.info(tag,"task: ",task)

        //submit charting
        let result = await pioneer.SubmitCharting(task);
        log.info(tag,"result: ",result)

    }catch(e){
        console.error(e)
    }
}

//start working on install
log.info(TAG," worker started! ","")
do_work_explore()




