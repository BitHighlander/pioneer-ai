"use strict";
/*
      CCbot

      generate response to input

      output:
        discord view

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
require('dotenv').config();
require('dotenv').config({ path: "../../../.env" });
require('dotenv').config({ path: "./../../.env" });
require('dotenv').config({ path: "../../../../.env" });
var packageInfo = require("../package.json");
var TAG = " | " + packageInfo.name + " | ";
var log = require('@pioneer-platform/loggerdog')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis, redisQueue = _a.redisQueue;
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
var BOT_NAME = process.env['BOT_NAME'] || 'pioneer';
var _b = require("openai"), Configuration = _b.Configuration, OpenAIApi = _b.OpenAIApi;
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY)
    throw Error("missing OPENAI_API_KEY");
var configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
var openai = new OpenAIApi(configuration);
//const AWS = require('aws-sdk');
var asciichart = require('asciichart');
// AWS.config.update({ region: 'eu-west-1' })
// const dynamodb = new AWS.DynamoDB();
var usersDB = connection.get('usersCCbot');
// usersDB.createIndex({username: 1}, {unique: true})
usersDB.createIndex({ user: 1 }, { unique: true });
var conversations = connection.get("conversations");
var rive = require('@pioneer-platform/ccbot-rivescript-brain');
//onStart
rive.initialize();
/***********************************************
 //        lib
 //***********************************************/
var help = function () {
    return "\n    ccbot help\n";
};
var deliberate_on_input = function (session, data, username) {
    return __awaiter(this, void 0, void 0, function () {
        var tag, output, body, response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = " | deliberate_on_input | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    output = {};
                    output.views = [];
                    output.sentences = [];
                    log.info(tag, "session: ", session);
                    log.info(tag, "data: ", data);
                    log.info(tag, "query: ", data.query);
                    body = {
                        model: "text-davinci-003",
                        prompt: data.query + "\n\n",
                        temperature: 0.7,
                        max_tokens: 756,
                        top_p: 1,
                        frequency_penalty: 0,
                        presence_penalty: 0,
                    };
                    return [4 /*yield*/, openai.createCompletion(body)];
                case 2:
                    response = _a.sent();
                    // console.log("response: ",response)
                    // console.log("response: ",response.data)
                    // console.log("response: ",response.data.choices)
                    // console.log("response: ",response.data.choices[0])
                    output.sentences = response.data.choices[0].text;
                    return [2 /*return*/, output];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
};
var do_work = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, work, allWork, timeReceive, session, response, event_1, result, timeRelease, duration, e_2;
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
                    if (!work.query)
                        throw Error("100: invalid work! missing query");
                    // if(!work.user) throw Error("101: invalid work! missing username")
                    if (!work.username)
                        throw Error("102: invalid work! missing username");
                    timeReceive = new Date().getTime();
                    session = 'discord';
                    return [4 /*yield*/, deliberate_on_input(session, work, work.username)];
                case 4:
                    response = _a.sent();
                    log.info(tag, "response: ", response);
                    event_1 = {
                        type: 'update',
                        username: work.username,
                        response: {
                            text: JSON.stringify(response.sentences)
                        }
                    };
                    return [4 /*yield*/, publisher.publish('pioneer', JSON.stringify(event_1))];
                case 5:
                    result = _a.sent();
                    console.log(result);
                    timeRelease = new Date().getTime();
                    duration = timeRelease - timeReceive;
                    redis.lpush(work.queueId, JSON.stringify(response));
                    return [3 /*break*/, 7];
                case 6:
                    log.info(tag, "queue empty!");
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
