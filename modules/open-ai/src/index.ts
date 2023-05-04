
const fs = require('fs-extra')
const log = require('@pioneer-platform/loggerdog')()
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const cheerio = require('cheerio');
const request = require('request');

module.exports = {


}


/*****************************************
 // Primary
 //*****************************************/

var create_rive = async function (rivescript:string) {
    try{

    }catch(e){

    }
}
