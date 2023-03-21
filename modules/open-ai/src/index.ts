
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
    raw:async function(input:string){

        request(input, (error: any, response: { statusCode: number; }, html: any) => {
            if(!error && response.statusCode == 200) {
                const webPage = cheerio.load(html);

                log.info("webPage: ",webPage.html())

                // const post = {
                //     title: $("h1.graf--title").text(),
                //     author: $("span.ds-link.ds-link--styleSubtle.link.link--darken.u-accentColor--textNormal.u-accentColor--textDarken.u-accentColor--textDarker").text(),
                //     content: $("div.section-inner.sectionLayout--insetColumn").text(),
                // };
                //
                // console.log(post);
            }
        });
        // let body = {
        //     model: "text-davinci-003",
        //     prompt: data.query+"\n\n",
        //     temperature: 0.7,
        //     max_tokens: 756,
        //     top_p: 1,
        //     frequency_penalty: 0,
        //     presence_penalty: 0,
        // }
        //
        // const response = await openai.createCompletion(body);

        return true
    },
    //save entire user history to file
    investigate:async function(){
        return true
    },
    //create rivescript
    create:function(rivescript:string){
        return create_rive(rivescript);
    },
    //create bash script

    //update

    //destroy
}


/*****************************************
 // Primary
 //*****************************************/

var create_rive = async function (rivescript:string) {
    try{

    }catch(e){

    }
}
