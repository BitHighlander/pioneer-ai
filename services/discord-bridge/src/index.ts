/*
    Discord bridge

    This bridge contains all the discord logic

    No bot logic

    Multi-plex for multiple bots and channels

 */
let TAG = ' | discord-bridge | '
require('dotenv').config()
require('dotenv').config({path:"./.env"})
require('dotenv').config({path:"./../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"../../../../.env"})

let log = require("@pioneer-platform/loggerdog")()
let queue = require("@pioneer-platform/redis-queue")
const {redis,subscriber,publisher, redisQueue} = require("@pioneer-platform/default-redis")
import {v4 as uuidv4} from 'uuid';

const Accounting = require('@pioneer-platform/accounting')
const accounting = new Accounting(redis)

const BOT_NAME = process.env['BOT_NAME']
if(!BOT_NAME) throw Error("BOT_NAME required!")

//mongo
let connection  = require("@pioneer-platform/default-mongo")
let discordIn = connection.get("discordIn");

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

const { Client, Intents, EmbedBuilder, GatewayIntentBits } = require('discord.js');
if(!EmbedBuilder) throw Error("Discord.js API changed!")
if(!Client) throw Error("Discord.js API changed!")

interface Data {
    queueId:string
    admin:boolean
    dm:boolean
    user:string
    username:string
    channel:string
    text:string
}

/*
  | 'GUILDS'
  | 'GUILD_MEMBERS'
  | 'GUILD_BANS'
  | 'GUILD_EMOJIS_AND_STICKERS'
  | 'GUILD_INTEGRATIONS'
  | 'GUILD_WEBHOOKS'
  | 'GUILD_INVITES'
  | 'GUILD_VOICE_STATES'
  | 'GUILD_PRESENCES'
  | 'GUILD_MESSAGES'
  | 'GUILD_MESSAGE_REACTIONS'
  | 'GUILD_MESSAGE_TYPING'
  | 'DIRECT_MESSAGES'
  | 'DIRECT_MESSAGE_REACTIONS'
  | 'DIRECT_MESSAGE_TYPING';
 */

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials:[
        'CHANNEL'
    ]
});

let discordChannel = process.env['DISCORD_BOT_CHANNEL']
if(!discordChannel) throw Error("DISCORD_BOT_CHANNEL env required! ")

let DISCORD_ADMIN_USERID = process.env['DISCORD_ADMIN_USERID']
if(!DISCORD_ADMIN_USERID) log.error(" no admins configured! ")

let TIMEOUT_BOT_RESPONSE = process.env['TIMEOUT_BOT_RESPONSE'] || 5

let msg:any
if(!process.env['DISCORD_BOT_TOKEN']) throw Error("env DISCORD_BOT_TOKEN required!")
bot.login(process.env['DISCORD_BOT_TOKEN']);

let BOT_USER:any
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    log.info("bot.user: ",bot.user)
    BOT_USER = bot.user.id
});


bot.on('messageCreate', async function (message:any) {
    let tag = " | discord message | "
    try {
        // log.info(tag,"message: ",JSON.stringify(message))
        // log.info(tag,"message: ",message.toString())
        // log.info(tag,"user: ",message.author.id)
        // log.info(tag,"channel: ",message.channel.name)
        // log.info(tag,"content: ",message.content)

        let admin = false
        let dm = false
        //detect admin
        if(message.author.id === DISCORD_ADMIN_USERID){
            log.info(tag,"Detected ADMIN")
            admin = true
        }

        //payload
        let data:Data = {
            queueId:uuidv4(),
            admin,
            dm,
            channel:message.channelId,
            user:message.author.id,
            username:message.author.username,
            text:message.cleanContent
        }
        log.info("Data: ",data)

        if(!message.channel.name && message.channel.type === 'DM'){
            log.info(tag,"DM detected!: ")
            // log.info("channel: ",message)
            // log.info("user: ",message.author.id)
            // log.info("channel: ",message.channel.name)
            // log.info("content: ",message.content)

            dm = true

            //if message is NOT ccbot
            if(message.author.id !== BOT_USER){
                log.info(tag," publishing to ccBot")
                //publish
                queue.createWork("bots:ccbot:ingest",data)

                //get response from ccBot
                let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
                if(response && response[0] && !response[1]) throw Error('invalid response from ccbot!')
                let responses = JSON.parse(response[1])
                log.info(tag," responses: ",responses)
                log.info(tag," responses: ",typeof(responses))

                //if text based

            }
        }

        //ccBot
        //filter by server



        if(message.author.id !== BOT_USER){

            //filter by channel
            let workCreated = await queue.createWork("bots:"+BOT_NAME+":ingest",data)
            log.info(tag,"workCreated: ",workCreated)
            let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
            log.info(tag,"response: ",response)

            //
            let responseString = response[1]
            let responses = JSON.parse(responseString)
            message.channel.send(responses.sentences);


            // log.info(tag," correct channel: ",discordChannel)
            // // log.info("message: ",JSON.stringify(message))
            // log.info(tag,"user: ",message.author.id)
            // log.info(tag,"channel: ",message.channel.name)
            // log.info(tag,"content: ",message.content)
            // log.info(tag,"cleanContent: ",message.cleanContent)

            //if valid
            // let workCreated = await queue.createWork("bots:"+BOT_NAME+":ingest",data)
            // log.info(tag,"workCreated: ",workCreated)
            // let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
            // log.info(tag,"response: ",response)

            // if(message.cleanContent && message.author.id){
            //
            //     //publish
            //     log.info("Submit work: ",data)
            //
            //     queue.createWork("bots:"+BOT_NAME+":ingest",data)
            //
            //     //get response from ccBot
            //     let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
            //     if(response){
            //         log.info(tag," response: ",response)
            //         if(!response[1]) throw Error('invalid response from ccbot!')
            //         let responses = JSON.parse(response[1])
            //         if(responses){
            //             log.info(tag," responses: ",responses)
            //             log.info(tag," responses: ",typeof(responses))
            //
            //             //if views
            //             let embeds = []
            //             for(let i = 0; i < responses.views.length; i++){
            //                 let view = responses.views[i]
            //
            //             }
            //
            //
            //         }
            //     } else {
            //         log.error("No reponse from bot!")
            //     }
            //
            //
            // } else {
            //     log.error(tag,"invalid message! ",message)
            //     log.error(tag,"cleanContent: ",message.cleanContent)
            // }
        }

        return
    } catch (e) {
        console.error('e', e)
        throw e
    }
})

