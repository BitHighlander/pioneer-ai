"use strict";
/*
      Skills creation worker

 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var BOT_NAME = 'pioneer-skills-creator';
console.log("USING USE_GPT_4");
require('dotenv').config();
require('dotenv').config({ path: "../../../.env" });
require('dotenv').config({ path: "./../../.env" });
require('dotenv').config({ path: "../../../../.env" });
var packageInfo = require("../package.json");
var TAG = " | " + packageInfo.name + " | ";
var util = require('util');
var log = require('@pioneer-platform/loggerdog')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis, redisQueue = _a.redisQueue;
var short = require('short-uuid');
var coincap = require('@pioneer-platform/ccbot-coincap');
console.log(coincap);
var easterEggCommands = require('@pioneer-platform/ccbot-easter-eggs');
var rebalance = require('@pioneer-platform/pioneer-rebalance');
var Accounting = require('@pioneer-platform/accounting');
var accounting = new Accounting(redis);
var Tokenizer = require('sentence-tokenizer');
var tokenizer = new Tokenizer('reddit');
var queue = require("@pioneer-platform/redis-queue");
var connection = require("@pioneer-platform/default-mongo");
var wait = require('wait-promise');
var sleep = wait.sleep;
var ai = require('@pioneer-platform/pioneer-intelligence');
var _b = require("openai"), Configuration = _b.Configuration, OpenAIApi = _b.OpenAIApi;
var OPENAI_API_KEY = process.env.OPENAI_API_KEY_4;
if (!OPENAI_API_KEY)
    throw Error("missing OPENAI_API_KEY");
var configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
var openai = new OpenAIApi(configuration);
var exec = require('child_process').exec;
//const AWS = require('aws-sdk');
var asciichart = require('asciichart');
// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();
var usersDB = connection.get('usersCCbot');
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({ user: 1 }, { unique: true });
var conversations = connection.get("conversations");
var knowledgeDB = connection.get('knowledge');
var rivescriptDB = connection.get('rivescriptRaw');
var skillsDB = connection.get('skills');
var credentialsDB = connection.get('credentials');
var fs = require('fs');
/***********************************************
 //        lib
 //***********************************************/
var save_skill = function (skill) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, skillId, script, entry, saved, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = TAG + " | save_skill | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    skillId = "CMD:0.0.1:" + short.generate();
                    script = fs.readFileSync('./run.sh', 'utf8');
                    log.info("script: ", script);
                    entry = {
                        created: new Date().getTime(),
                        skillId: skillId,
                        script: skill.script,
                        description: skill.summary,
                        keywords: skill.keywords
                    };
                    log.info("entry: ", entry);
                    return [4 /*yield*/, skillsDB.insert(entry)];
                case 2:
                    saved = _a.sent();
                    log.info("saved: ", saved);
                    return [2 /*return*/, entry];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    throw e_1;
                case 4: return [2 /*return*/];
            }
        });
    });
};
//write
/*
    Build a script
 */
// const build_a_script = async function(output:string, context:string){
//     let tag = TAG+" | build_a_script | "
//     try{
//         log.info("build_a_script checkpoint : ",output)
//
//         let messages = [
//             {
//                 role:"system",
//                 content:"You are a skills creation bot. you write bash scripts that wrap clis. you find common CLIs that does usefull things and wrap them in bash scripts that format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself. to the output of the bash scripts is always in the following json format {success:boolean,output:string,summary:string}"
//             },
//             {
//                 role:"system",
//                 content:"you always output in the following format {script:string,inputsCount:number, inputs:[{position:number,name:string,description:string,example:string}],outputs:any, outputMap:{verbal descript of each field and what data in there},summary:string,keywords:string[]}"
//             },
//             {
//                 role:"system",
//                 content:" you never attach any extra characters or words. you never say result:  Here's a bash script that... you only output the json outputs, you review the script to verify it will parse to json closely. if needed you will escape ticks in the bash script to make sure it parses json via JSON.parse correctly. you never forget to put a shabam at the top of the bash script. or words around the output. it is pure stringifies json. the script field of the output must be a stringifies version of a bash script. of there are any install commands needed you must add them inside the bash script."
//             },
//             {
//                 role:"system",
//                 content:"Bash Scripts are always written for MacOS"
//             },
//             {
//                 role:"system",
//                 content:" you always double check that the ouput script is valid and will parse. you prevent errors like  Unexpected token $ in JSON at position 39 by escaping the ticks in the bash script. you always double check that the ouput script is valid and will parse. you prevent errors like  Unexpected token $ in JSON at positions by escaping the ticks in the bash script."
//             },
//             {
//                 role:"user",
//                 content:"context info: "+context
//             },
//             {
//                 role:"user",
//                 content:"user requests you: "+output
//             }
//         ]
//
//         //log.info(tag,"messages: ",messages)
//         //
//         let body = {
//             model: "gpt-4",
//             messages,
//         }
//         let response = await openai.createChatCompletion(body);
//
//         // console.log("response: ",response.data)
//         // console.log("response: ",response.data.choices[0])
//         // console.log("response: ",response.data.choices[0].message.content)
//         return response.data.choices[0].message.content
//     }catch(e){
//         console.error(e)
//     }
// }
//test
// let validate_gpt_json_output = async function(output:string, e:any){
//     let tag = TAG+ " | validate_gpt_json_output | "
//     try{
//         let messages = [
//             {
//                 role:"system",
//                 content:"You are a cleanup bot. you take the output of a gpt-4 chatbot and clean it up. you remove all the system messages. you remove all the user messages. you remove all the content that is not a JSON response. you evaluate all fields of the JSON to verify it will parse with JSON. stringify without error. you never change any content"
//             },
//             {
//                 role:"system",
//                 content:"you always output in the following format {script:string,inputsCount:number, inputs:[{position:number,name:string,description:string,example:string}],outputs:any, outputMap:{verbal descript of each field and what data in there},summary:string,keywords:string[]}"
//             },
//             {
//                 role:"user",
//                 content:"the error was e: "+e.toString()
//             },
//             {
//                 role:"user",
//                 content:output
//             }
//         ]
//
//         //log.info(tag,"messages: ",messages)
//         //
//         let body = {
//             model: "gpt-4",
//             messages,
//         }
//         let response = await openai.createChatCompletion(body);
//         return response.data.choices[0].message.content
//     }catch(e){
//         console.error(e)
//     }
// }
//save
var do_work = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, work, allWork, context, contextString, result, saveSuccess, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = TAG + " | do_work | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, queue.count("bots:" + BOT_NAME + ":ingest")];
                case 2:
                    allWork = _a.sent();
                    log.debug(tag, "allWork: ", allWork);
                    return [4 /*yield*/, queue.getWork("bots:" + BOT_NAME + ":ingest", 60)];
                case 3:
                    work = _a.sent();
                    if (!work) return [3 /*break*/, 6];
                    log.info("work: ", work);
                    if (!work.work)
                        throw Error("100: invalid work! missing work");
                    // if(!work.user) throw Error("101: invalid work! missing username")
                    if (!work.username)
                        throw Error("102: invalid work! missing username");
                    if (!work.channel)
                        throw Error("103: invalid work! missing channel");
                    context = {
                        API_KEY: process.env["GOOGLE_SEARCH_API_KEY"],
                        OPENAI_API_KEY_4: process.env["OPENAI_API_KEY_4"],
                        OPENAI_API_KEY_3: process.env["OPENAI_API_KEY_3"],
                        GH_TOKEN: process.env["GH_TOKEN"],
                    };
                    contextString = JSON.stringify(context);
                    if (typeof (work.work) !== "string")
                        work.work = JSON.stringify(work.work);
                    return [4 /*yield*/, ai.buildScript(work.work, contextString)];
                case 4:
                    result = _a.sent();
                    log.info(tag, "result: ", result);
                    log.info(tag, "result: ", typeof (result));
                    if (typeof (result) === "string")
                        result = JSON.parse(result);
                    if (!result.script)
                        throw Error("Invalid result! missing script");
                    if (!result.summary)
                        throw Error("Invalid result! missing summary");
                    if (!result.keywords)
                        throw Error("Invalid result! missing keywords");
                    if (!result.inputs)
                        throw Error("Invalid result! missing keywords");
                    if (!result.inputsCount)
                        throw Error("Invalid result! missing inputsCount");
                    return [4 /*yield*/, save_skill(result)];
                case 5:
                    saveSuccess = _a.sent();
                    log.info(tag, "saveSuccess: ", saveSuccess);
                    if (!saveSuccess.skillId)
                        throw Error("Failed to save Skill!");
                    return [3 /*break*/, 7];
                case 6:
                    log.debug(tag, "queue empty!");
                    _a.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_2 = _a.sent();
                    log.error(tag, "e: ", e_2);
                    log.error(tag, "e: ", e_2.message);
                    work.error = e_2.message;
                    queue.createWork("pioneer:pubkey:ingest:deadletter", work);
                    return [3 /*break*/, 9];
                case 9:
                    //dont stop working even if error
                    do_work();
                    return [2 /*return*/];
            }
        });
    });
};
//start working on install
log.info(TAG, " worker started! ", "");
do_work();
