/*
    Discord bridge

    This bridge contains all the discord logic

    No bot logic

    Multi-plex for multiple bots and channels
        https://discordapp.com/oauth2/authorize?&client_id=865670112611008524&scope=bot&permission=8


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

const { Client, Intents, Partials, EmbedBuilder, GatewayIntentBits } = require('discord.js');
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
    discordName?:string
    discordId?:string
    sessionId?:string
    messageId?:string
    output?:{
        views:any
        sentences:any
    }
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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials:[
        Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User
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

bot.on('message', (message: { channel: { type: string }; reply: (arg0: string) => void }) => {
    console.log("message: ",message)
    if (message.channel.type === 'dm') {
        message.reply('Thanks for messaging me! How can I help you?');
    }
});

bot.on('interactionCreate', async (interaction: { isChatInputCommand: () => any; commandName: string; reply: (arg0: string) => any }) => {
    if (!interaction.isChatInputCommand()) return;
    console.log("interactionCreate: ",interaction)

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

const create_view = async function(view:any,message:any,data:any){
    let tag = TAG + " | create_view | "
    try{
        log.info(tag,{view,message,data})
        let output:any = {
            embeds:[]
        }
        switch(view.type) {
            case 'task':

                let allFields:any = []
                for(let i = 0; i < view.data.steps.length; i++){
                    let step = view.data.steps[i]
                    let entry = {
                        name:" ("+ i+1 + ") "+step.name,
                        value:"type: "+step.type + " input:" + step.input + "  action: " +step.action,
                        inline: true,
                        setColor: '#ff002b'
                    }
                    allFields.push(entry)
                }

                // code block
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(data.message+ ":" +data.summary)
                    .setDescription(data.finalGoal)
                    .addFields(
                        allFields
                    )
                    .setFooter({ text: "Pioneer", iconURL: "https://cdn3.vectorstock.com/i/1000x1000/50/22/green-compass-vector-3755022.jpg" });


                output.embeds.push(embed)
                break;
            default:
            // code block
        }

        return output
    }catch(e){
        log.error(e)
    }
}


//sub to redis for push messages
subscriber.subscribe('discord-bridge')
subscriber.on('message', async function (channel:string, payloadS:string) {
    let tag = TAG + ' | publishToFront | ';
    try {
        log.info(tag,channel+ " event: ",payloadS)
        //Push event over socket
        let payload = JSON.parse(payloadS)

        //expect channelID
        if(!payload.channel) throw Error("payload.channel required!")
        if(!payload.responses) throw Error("payload.responses required!")
        // if(!payload.discord) throw Error("payload.discord required!")

        // Find the channel you want to send the message to
        const channelObj = bot.channels.cache.get(payload.channel);

        if(payload.responses.sentences && payload.responses.sentences.length > 0){
            // Send the message to the channel
            channelObj.send(payload.message)
                .then(() => {
                    log.info(`Message sent to channel ${channelObj.name}: ${payload.message}`);
                })
                .catch(console.error);
        }

        //views
        if(payload.responses.views && payload.responses.views.length > 0){
            for(let i = 0; i < payload.responses.views.length; i++){
                let view = payload.responses.views[i]
                log.info(tag,"view: ",view)

                let output = await create_view(view,view.message,view.data)
                log.info(tag,"output: ",output)

                if(output.embeds.length > 0){
                    channelObj.send(output)
                        .then(() => {
                            log.info(`Message sent to channel ${channelObj.name}: `,output);
                        })
                        .catch(console.error);
                }
            }
        }

    } catch (e) {
        log.error(tag, e);
        //throw e
    }
});

bot.on('messageCreate', async function (message:any) {
    let tag = " | discord message | "
    try {

        log.info(tag,"message: ",JSON.stringify(message))
        log.info(tag,"message: ",message.toString())
        log.info(tag,"user: ",message.author.id)
        log.info(tag,"channel: ",message.channel.name)
        log.info(tag,"content: ",message.content)

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
        if(!message.guildId){
            log.info(tag,"DM detected!: ")
            // log.info("channel: ",message)
            // log.info("user: ",message.author.id)
            // log.info("channel: ",message.channel.name)
            // log.info("content: ",message.content)

            dm = true

            //if message is NOT ccbot

        }

        //ccBot dont respond to itself
        if(message.author.id !== BOT_USER){
            //filter by server
            if(!dm){
                let guildInfo = await bot.guilds.fetch(message.guildId)
                log.info(tag,"guildInfo: ",guildInfo)
                message.guildInfo = guildInfo
                data.discordName = guildInfo.name
                data.discordId = message.guildId
            }


            //filter by channel
            if(message.channel.name === discordChannel || dm){
                //filter by channel
                let workCreated = await queue.createWork("bots:"+PIONEER_BOT_NAME+":ingest",data)
                log.info(tag,"workCreated: ",workCreated)

                message.channel.send("thinking...");
                let response = await redisQueue.blpop(data.queueId, TIMEOUT_BOT_RESPONSE)
                log.info(tag,"response: ",response)

                //
                if(response && response[1]){
                    let responseString = response[1]
                    let responses = JSON.parse(responseString)
                    log.info(tag," responses: ",responses)
                    log.info(tag," responses: ",typeof(responses))
                    log.info(tag," responses: ",responses.sentences)
                    if(responses.sentences && responses.sentences.length > 0){
                        if(!PIONEER_NOT_NERFED) log.info("NERF: I WOULD BE SENDING MESSAGE: ",responses)
                        if(PIONEER_NOT_NERFED) message.channel.send(responses.sentences.toString() || "");
                    }

                    //views
                    if(responses.views && responses.views.length > 0){
                        for (const view of responses.views) {
                            let output = await create_view(view,message,data)
                            log.info(tag,"output: ",output)
                            message.channel.send(output)
                        }
                    }

                }
            }
        }

        return
    } catch (e) {
        console.error('e', e)
        // throw e
    }
})

