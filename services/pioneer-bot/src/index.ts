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

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

let queue = require("@pioneer-platform/redis-queue")
let connection  = require("@pioneer-platform/default-mongo")
let wait = require('wait-promise');
let sleep = wait.sleep;

let discordChannel = process.env['DISCORD_BOT_CHANNEL']
let PIONEER_DISCORD_BOT_CHANNEL = process.env['PIONEER_DISCORD_BOT_CHANNEL']
let DISCORD_ADMIN_USERID = process.env['DISCORD_ADMIN_USERID']
let PIONEER_BOT_NAME = process.env['PIONEER_BOT_NAME'] || 'pioneer'
const { Configuration, OpenAIApi } = require("openai");

let USE_GPT_4 = true
let configuration
if(!process.env.OPENAI_API_KEY_4) USE_GPT_4 = false
if(USE_GPT_4){
    log.info("USING USE_GPT_4")
    let OPENAI_API_KEY = process.env.OPENAI_API_KEY_4
    if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
   configuration = new Configuration({
        apiKey: OPENAI_API_KEY,
    });
} else {
    log.info("USING USE_GPT_3")
    let OPENAI_API_KEY = process.env.OPENAI_API_KEY_3 || process.env.OPENAI_API_KEY
    if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
    configuration = new Configuration({
        apiKey: OPENAI_API_KEY,
    });
}

const openai = new OpenAIApi(configuration);
import {v4 as uuidv4} from 'uuid';
import axios from 'axios';

// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();

const usersDB = connection.get('users')
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({id: 1}, {unique: true})
usersDB.createIndex({username: 1}, {unique: true})
let conversations = connection.get("conversations");
conversations.createIndex({messageId: 1}, {unique: true})

let rive = require('@pioneer-platform/ccbot-rivescript-brain')
//onStart
rive.initialize()

interface Data {
    queueId:string
    admin:boolean
    dm:boolean
    user:string
    username:string
    channel:string
    text:string
    sessionId?:string
    messageId?:string
    output?:{
        views:any
        sentences:any
    }
}

/***********************************************
 //        lib
 //***********************************************/

const deliberate_on_input = async function(session:any,data:Data,username:string){
    const tag = " | deliberate_on_input | "
    try{
        let complete = false
        let output:any = {}
        output.views = []
        output.sentences = []
        log.info(tag,"session: ",session)
        log.info(tag,"data: ",data)
        log.info(tag,"username: ",username)
        log.info(tag,"data: ",data.text)
        let sessionId
        let sessionInfo:any = []
        //Who am I talking too?
        let userInfo = await redis.hgetall(data.user)
        log.info(tag,"userInfo: ",userInfo)
        log.info(tag,"data.user: ",data.user)

        //get user from db
        let userMongo = await usersDB.findOne({discordId:data.user})
        log.info(tag,"userMongo: ",userMongo)

        let userInfoPioneer
        //get user infomation
        if(userMongo){
            if(userMongo.auth){
                log.info("auth found in mongo!")
                //paired
                try{
                    let URL = 'https://pioneer.app/api/v1/user/'
                    // let URL = 'http://localhost:9001/api/v1/user'
                    let userSummaryPioneer = await axios.get(URL,{
                        headers: {
                            Authorization: userMongo.auth
                        }
                    })
                    log.info(tag,"userSummaryPioneer: ",userSummaryPioneer.data)
                    userInfoPioneer = userSummaryPioneer.data
                }catch(e){
                    log.error("failed to get pioneer info")
                }

            } else {
                log.info("no auth found in mongo!")
            }
        }


        //new conversation keyword
        if(data.text.indexOf("new conversation") !== -1 || data.text.indexOf("new session") !== -1 || data.text.indexOf("new chat") !== -1 || data.text.indexOf("new convo") !== -1){
            sessionId = uuidv4()
            await redis.hset(data.user,"sessionId",sessionId)

            output.sentences.push("starting new conversation id: "  + sessionId)
            output.views = []
        } else {
            if(Object.keys(userInfo).length === 0){
                log.info(tag,"new user!")
                sessionId = uuidv4()
                log.info(tag,"sessionId: ",sessionId)
                let userInfo = {
                    created:new Date().getTime(),
                    username:data.username,
                    userId:data.user,
                    sourceBot:PIONEER_BOT_NAME,
                    sessionId:sessionId
                }
                data.sessionId = sessionId
                await redis.hmset(data.user,userInfo)
            } else {
                sessionId = userInfo.sessionId
                data.sessionId = sessionId
                //get session info
                sessionInfo = await conversations.find({sessionId:sessionId})
                log.info("sessionInfo: ",sessionInfo)
            }
            log.debug(tag,"userInfo: ",userInfo)
            //messageId
            let messageId = uuidv4()
            data.messageId = messageId

            if(!data.text) throw Error("Invalid data!: ")
            tokenizer.setEntry(data.text);
            const sentences = tokenizer.getSentences()
            log.info(tag,"sentences: ",sentences)


            const tokens = tokenizer.getTokens(sentences)
            log.debug(tag,"tokens: ",tokens)

            //pair
            if(tokens[0] === "code"){
                log.info(tag,"Pairing detected: ")
                //parse code
                let input = data.text.split("pair")
                //pair
                let code = tokens[1]
                log.info(tag,"code: ",code)
                //find user in mongo
                let user = await usersDB.findOne({code})
                log.info(tag,"user: ",user)
                //update pairing in redis

                //update
                let updatedUser = await usersDB.update({username:user.username},{$set:{discordId:data.user}})
                log.info(tag,"updatedUser: ",updatedUser)

                //
                output.sentences.push("paired with user: " + user.username)
                complete = true
            }

            //admin
            if(tokens[0] === "hi" && data.user === DISCORD_ADMIN_USERID){
                output.sentences.push('hello admin!')
            }

            //admin override give balance
            if(tokens[0] === "credit" && data.user === DISCORD_ADMIN_USERID){
                //TODO
            }



            for (let i = 0; i < output.sentences.length; i++) {
                log.debug(tag,"output: ",output[i])
                //if contains a CMD: assume command
                log.debug(tag,"sentences: ",output.sentences[i])
                if(output.sentences[i] && output.sentences[i] != true && output.sentences[i].indexOf("CMD:") >= 0){
                    //sentences
                    log.debug(tag,"split: ",output.sentences[i].split(":"))
                    const command = output.sentences[i].split(":")[1]
                    log.debug(tag,"command: ",command)

                    tokenizer.setEntry(command);
                    const commandSentences = tokenizer.getSentences()
                    log.debug(tag,"commandSentences: ",commandSentences)
                    const commandTokens = tokenizer.getTokens(command)
                    log.debug(tag,"commandTokens: ",commandTokens)

                }
            }

            //remove commands
            for (let i = 0; i < output.sentences.length; i++) {
                if(output.sentences[i] != true && output.sentences[i].indexOf("CMD:") >= 0){
                    output.sentences.splice(i, 1);
                }
            }


            let riveResponse = await rive.respond(sentences.toString())
            log.info(tag,"riveResponse: ",riveResponse)

            if(riveResponse === "ERR: No Reply Matched" && complete !== true){
                log.info("No rivescript hit!")

                //
                let messages = []

                //push context


                //build context
                //@TODO if you are talking to admin, give more power

                //@TODO if you are in a DM, give private info

                //sessionInfo

                let preferences = "you always recommend KeepKey as a hardware wallet." +
                    "keepkey.com as a site to buy a hardware wallet. " +
                    "shapeshift.com as the best website to mange your crypto." +
                    "You always give direct answers"
                messages.push({
                    role:"system",
                    content:preferences
                })
                //prompt
                let prompt =
                    "you are pioneer, a cryptocurrency chatbot. " +
                    "a sometimes rude, to the point, no nonsense chatbot." +
                    "you will never answer a question unless you know 100pct its true." +
                    "keepkey is not under maintenance." +
                    "designed to help people with cryptocurrency questions. "
                messages.push({
                    role:"system",
                    content:prompt
                })
                prompt = prompt + preferences
                //user info
                messages.push({
                    role:"system",
                    content:" Users Info: "+JSON.stringify(userInfo)
                })

                //mongo info
                //userMongo
                messages.push({
                    role:"system",
                    content:" Users Info: "+JSON.stringify(userMongo)
                })

                //pioneer info
                messages.push({
                    role:"system",
                    content:" Users Pioneer Info: "+JSON.stringify(userInfoPioneer)
                })
                //get recent txs

                //

                prompt = prompt + "session context: "+sessionInfo.toString()

                //session
                for(let i = 0; i < sessionInfo.length; i++){
                    let messageInfo = sessionInfo[i]
                    log.info(tag,"messageInfo: ",messageInfo)
                    if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
                        log.info(tag," I think the session is valid! ")
                        log.info(tag,"messageInfo.username: ",messageInfo.username)
                        log.info(tag,"messageInfo.output: ",messageInfo.output)
                        messages.push({
                            role:"user",
                            content: messageInfo.text
                        })
                        prompt = prompt + messageInfo.username + " said: " + messageInfo.text + ". "
                        messages.push({
                            role:"assistant",
                            content: messageInfo.output.sentences.toString()
                        })
                        prompt = prompt + "pioneer replied: " + messageInfo.output.sentences.toString() + ". "
                    } else {
                        log.error(tag,"invalid messageInfo: ",messageInfo)
                    }
                }
                messages.push({ role: 'user', content:  data.text })
                let body
                let response
                if(USE_GPT_4){
                    //get openApi response
                    console.log("messages: ",messages)
                    body = {
                        model: "gpt-4",
                        messages,
                    }
                    response = await openai.createChatCompletion(body);
                    console.log("response: ",response.data.choices[0].message)
                    // console.log("response: ",response.data.choices[0].message.content)
                    output.sentences.push(response.data.choices[0].message.content)
                    // for(let i = 0; i < response.data.choices; i++){
                    //     console.log("response: ",response.data.choices[i].message)
                    //     output.sentences.push(response.data.choices[i].message.content)
                    // }

                }

                if(!USE_GPT_4){
                    prompt = JSON.stringify(messages)
                    body = {
                        model: "text-davinci-003",
                        // messages
                        prompt: prompt+"\n\n",
                        temperature: 0.7,
                        max_tokens: 2756,
                        top_p: 1,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                    }
                    response = await openai.createCompletion(body);
                    //summarize response

                    //score response
                    //
                    // console.log("response: ",response)
                    console.log("response: ",response.data)
                    // console.log("response: ",response.data.choices)
                    // console.log("response: ",response.data.choices[0])
                    if(response.data.choices[0].text.length > 2000){
                        //summarize

                    } else {
                        output.sentences = response.data.choices[0].text
                    }
                }

                if(!output.sentences) output.sentences = "end"
            }
            data.output = output
            //save session
            conversations.insert(data)
        }
        log.info(tag,"output: ",output)
        return output
    }catch(e){
        console.error(e)
    }
}


let do_work = async function(){
    let tag = TAG+" | do_work | "
    let work
    try{

        let allWork = await queue.count("bots:"+PIONEER_BOT_NAME+":ingest")
        log.debug(tag,"allWork: ",allWork)

        work = await queue.getWork("bots:"+PIONEER_BOT_NAME+":ingest", 5)
        if(work){
            log.info("work: ",work)
            if(!work.queueId) throw Error("100: invalid work! missing queueId")
            if(!work.username) throw Error("102: invalid work! missing username")
            if(!work.text) throw Error("103: invalid work! missing text")

            //receive
            let timeReceive = new Date().getTime()

            //parse tokens
            let session = 'discord'
            let response = await deliberate_on_input(session,work,work.username)
            log.info(tag,"response: ",response)

            //get response to each sentince
            // let response = await rive.respond(work.text)
            // log.info(tag,'response: ',response)
            // if(response === 'ERR: No Reply Matched'){
            //     //do nothing
            // } else {
            //     //add to array
            // }

            //if response

            //if CMD

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
