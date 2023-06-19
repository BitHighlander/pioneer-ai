/*
    CORE BRAINS of pioneer bot

 */
const TAG  = " | pioneer-explore | "
const fs = require('fs-extra')
const log = require('@pioneer-platform/loggerdog')()
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
let openai: any
const os = require('os');
let wait = require('wait-promise');
let sleep = wait.sleep;
import * as dotenv from "dotenv";
dotenv.config();
const { OpenAI } = require("langchain/llms/openai");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("langchain/prompts");
const { VectorDBQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores");
const { OpenAIEmbeddings } = require("langchain/embeddings");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
let connection  = require("@pioneer-platform/default-mongo")
const knowledgeDB = connection.get('knowledge');
knowledgeDB.createIndex({title: 1}, {unique: true})

//globals
let vectorStore: any;
let docs: any
// @ts-ignore
let CHUNK_SIZE = parseInt(process.env['CHUNK_SIZE']) || 2000;
let ALL_MEMORY:any = []
let textSplitter: any

module.exports = {
    init:function(settings:any){
        //get data from from db
        if(settings.CHUNK_SIZE) CHUNK_SIZE = settings.CHUNK_SIZE
        textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE });

        //override api key
        if(settings.OPENAI_API_KEY) {
            configuration = new Configuration({
                apiKey: settings.OPENAI_API_KEY,
            });
        }
        //init openai
        openai = new OpenAIApi(configuration);

        //get default brain

        //load default brain

        return true
    },
    //list knowledge loaded

    //load String
    loadString:function(data:string){
        return load(data)
    },
    //load knowledge
    loadKnowledge:function(datasets:string[]){
        return load_knowledge(datasets)
    },
    //unload knowledge

    //explore knowledge
    query:function(query:string){
        return run_query(query)
    },
}


/*****************************************
 // Primary
 //*****************************************/

let run_query = async function(search: string) {
    let tag = TAG + " | run_query | ";
    try {
        if(!vectorStore) throw Error("Must load vectorStore first!")
        if(!docs) throw Error("Must load docs first!")
        const model = new OpenAI({ temperature: 0.1 });
        const chain = VectorDBQAChain.fromLLM(model, vectorStore);

        // Start tracking time
        const timeStart = new Date().getTime();
        const res = await chain.call({
            input_documents: docs,
            query: search,
        });

        // Stop tracking time
        const timeEnd = new Date().getTime();

        // Calculate elapsed time
        const elapsedTime = timeEnd - timeStart;
        console.log("Elapsed time: " + elapsedTime + "ms");
        return res;
    } catch (e) {
        console.error(e);
    }
};

export async function load(data:string) {
    try{
        //clear memory
        //vectorStore = null
        ALL_MEMORY.push(data)
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE });
        //create docs
        docs = await textSplitter.createDocuments(ALL_MEMORY);
        //load vectorDB
        vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
        return true
    }catch(e){
        console.error(e)
    }
}

export async function load_knowledge(datasets:string[]) {
    try{
        //clear memory
        //vectorStore = null
        let ALL_MEMORY = []
        //get data from from db
        for(let i = 0; i< datasets.length;i++){
            let dataset = datasets[i]
            //query db
            let data = await knowledgeDB.findOne({title:dataset})
            if(data && data.data){
                ALL_MEMORY.push(data.data)
            }
        }
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE });
        //create docs
        docs = await textSplitter.createDocuments(ALL_MEMORY);
        //load vectorDB
        vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
        return true
    }catch(e){
        console.error(e)
    }
};

let summarize_string_to_schema = async function(input:string, schema:any){
    let tag = TAG+ " | summarize_string_to_schema | "
    try{
        let messages = [
            {
                role:"system",
                content:"you take the input and find params that are needed for the output. if you dont see enough data you guess wildly, you are parsing the results of a website and trying to make a dapp listing for a database that indexes web3 dapps"
            },
            {
                role:"system",
                content:' you only output valid JSON in this format: '+JSON.stringify(schema)
            },
            {
                role:"user",
                content:"the website data is: "+JSON.stringify(input)
            }
        ]
        //gpt-3.5-turbo-0613
        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-0613",
            messages
        });
        // console.log("chatCompletion: ",chatCompletion)
        let output = chatCompletion.data.choices[0].message.content
        //try to parse the output to json
        try{
            output = JSON.parse(output)
        }catch(e){
            log.info(tag,"output: ",output)
            log.error("Failed to parse: ",e)
            output = generalized_json_parser(chatCompletion.data.choices[0].message.content, schema, e)
        }
        //loop untill its valid

        return output
    }catch(e){
        console.error(e)
    }
}

let generalized_json_parser = async function(input:string, schema:any, e:any){
    let tag = TAG+ " | generalized_json_parser | "
    try{

        let messages = [
            {
                role:"system",
                content:"you are a cleanup bot. take the input and turn into a json, do not change any vaules"
            },
            {
                role:"system",
                content:' you only output valid JSON in this format: '+JSON.stringify(schema)
            },
            {
                role:"system",
                content:' DO NOT ADD ANY EXTRA STRING, no The output would be: no JSON: only output a string that can parse via JSON.parse if your output fails to parse JSON.parse it will be rejected and you lose points'
            },
            {
                role:"user",
                content:"here is the string gpt output: "+JSON.stringify(input)+" here is the error "+JSON.stringify(e)
            }
        ]
        // log.info(tag,"prompt: ",messages)

        //gpt-3.5-turbo-0613
        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo-0613",
            messages
        });
        // console.log("chatCompletion: ",chatCompletion)
        let output = chatCompletion.data.choices[0].message.content

        //try to parse the output to json
        try{
            output = JSON.parse(output)
        }catch(e){
            log.info(tag,"output: ",output)
            log.error("Failed to parse: ",e)
            generalized_json_parser(chatCompletion.data.choices[0].message.content, schema, e)
        }
        //loop untill its valid

        return output
    }catch(e){
        console.error(e)
    }
}

