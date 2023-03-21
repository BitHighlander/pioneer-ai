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

const PIONEER_BOT_NAME = process.env['PIONEER_BOT_NAME']
if(!PIONEER_BOT_NAME) throw Error("PIONEER_BOT_NAME required!")

//mongo
let connection  = require("@pioneer-platform/default-mongo")
let discordRaw = connection.get("discordRaw");
let knowledge = connection.get("knowledge");

const Tokenizer = require('sentence-tokenizer');
const tokenizer = new Tokenizer('reddit');

const { Client, Intents, EmbedBuilder, GatewayIntentBits } = require('discord.js');
if(!EmbedBuilder) throw Error("Discord.js API changed!")
if(!Client) throw Error("Discord.js API changed!")

// let PIONEER_NOT_NERFED:any = process.env['PIONEER_NOT_NERFED']
let PIONEER_NOT_NERFED = true
if(PIONEER_NOT_NERFED)log.info(" PIONEER LIVE! IT WILL RESPOND TO MESSAGES!")
if(!PIONEER_NOT_NERFED)log.info(" PIONEER_NERFed!")

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

let discordChannel = process.env['PIONEER_DISCORD_BOT_CHANNEL']
if(!discordChannel) throw Error("PIONEER_DISCORD_BOT_CHANNEL env required! ")

let DISCORD_ADMIN_USERID = process.env['DISCORD_ADMIN_USERID']
if(!DISCORD_ADMIN_USERID) log.error(" no admins configured! ")

let TIMEOUT_BOT_RESPONSE = process.env['TIMEOUT_BOT_RESPONSE'] || 600

let msg:any
if(!process.env['PIONEER_DISCORD_BOT_TOKEN']) throw Error("env PIONEER_DISCORD_BOT_TOKEN required!")
console.log(process.env['PIONEER_DISCORD_BOT_TOKEN'])
bot.login(process.env['PIONEER_DISCORD_BOT_TOKEN']);

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
        discordRaw.insert(data)
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
                queue.createWork("bots:"+BOT_USER+":ingest",data)

                //get response from ccBot
                let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
                if(response && response[0] && !response[1]) throw Error('invalid response from ccbot!')
                if(response && response[1]){
                    let responses = JSON.parse(response[1])
                    log.info(tag," responses: ",responses)
                    log.info(tag," responses: ",typeof(responses))
                }


                //if text based

            }
        }

        //ccBot
        //filter by server
        if(message.author.id !== BOT_USER){

            //filter by channel
            let workCreated = await queue.createWork("bots:"+PIONEER_BOT_NAME+":ingest",data)
            log.info(tag,"workCreated: ",workCreated)
            let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
            log.info(tag,"response: ",response)

            //
            if(response && response[1]){
                let responseString = response[1]
                let responses = JSON.parse(responseString)
                log.info(tag," responses: ",responses)
                log.info(tag," responses: ",typeof(responses))
                log.info(tag," responses: ",responses.sentences)
                log.info(tag," responses: ",responses.sentences.toString())
                if(!PIONEER_NOT_NERFED) log.info("NERF: I WOULD BE SENDING MESSAGE: ",responses)
                if(PIONEER_NOT_NERFED) message.channel.send(responses.sentences.toString() || "");
            }
        }

        return
    } catch (e) {
        console.error('e', e)
        throw e
    }
})

