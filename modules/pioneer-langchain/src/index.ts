
const TAG = " | pioneer-langchain | "
// @ts-ignore
import * as dotenv from "dotenv";
dotenv.config();
// import { OpenAI } from "langchain/llms/openai";
// import { VectorDBQAChain } from "langchain/chains";
// import { HNSWLib } from "langchain/vectorstores";
// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const { OpenAI } = require("langchain/llms/openai");
const { VectorDBQAChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores");
const { OpenAIEmbeddings } = require("langchain/embeddings");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
let connection  = require("@pioneer-platform/default-mongo")
const knowledgeDB = connection.get('knowledge');
knowledgeDB.createIndex({title: 1}, {unique: true})
import * as fs from "fs";

let vectorStore: any;
let docs: any
// @ts-ignore
let CHUNK_SIZE = parseInt(process.env['CHUNK_SIZE']) || 2000;
export function init(settings:any) {
    try{
        //get data from from db
        if(settings.CHUNK_SIZE) CHUNK_SIZE = settings.CHUNK_SIZE
    }catch(e){
        console.error(e)
    }
};

export async function load(datasets:string[]) {
    try{
        vectorStore = null
        let ALL_MEMORY = []
        //get data from from db
        for(let i = 0; i< datasets.length;i++){
            let dataset = datasets[i]
            //query db
            let data = await knowledgeDB.findOne({title:dataset})
            ALL_MEMORY.push(data.data)
        }
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE });
        //create docs
        docs = await textSplitter.createDocuments(ALL_MEMORY);
        //load vectorDB
        vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    }catch(e){
        console.error(e)
    }
};

export function query(search:string) {
    return run_query(search)
};


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
        const TAG = " | pioneer-langchain | "
// @ts-ignore
        import * as dotenv from "dotenv";
        dotenv.config();
// import { OpenAI } from "langchain/llms/openai";
// import { VectorDBQAChain } from "langchain/chains";
// import { HNSWLib } from "langchain/vectorstores";
// import { OpenAIEmbeddings } from "langchain/embeddings";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
        const { OpenAI } = require("langchain/llms/openai");
        const { VectorDBQAChain } = require("langchain/chains");
        const { HNSWLib } = require("langchain/vectorstores");
        const { OpenAIEmbeddings } = require("langchain/embeddings");
        const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
        let connection  = require("@pioneer-platform/default-mongo")
        const knowledgeDB = connection.get('knowledge');
        knowledgeDB.createIndex({title: 1}, {unique: true})
        import * as fs from "fs";

        let vectorStore: any;
        let docs: any
// @ts-ignore
        let CHUNK_SIZE = parseInt(process.env['CHUNK_SIZE']) || 2000;
        export function init(settings:any) {
            try{
                //get data from from db
                if(settings.CHUNK_SIZE) CHUNK_SIZE = settings.CHUNK_SIZE
            }catch(e){
                console.error(e)
            }
        };

        export async function load(datasets:string[]) {
            try{
                vectorStore = null
                let ALL_MEMORY = []
                //get data from from db
                for(let i = 0; i< datasets.length;i++){
                    let dataset = datasets[i]
                    //query db
                    let data = await knowledgeDB.findOne({title:dataset})
                    ALL_MEMORY.push(data.data)
                }
                const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE });
                //create docs
                docs = await textSplitter.createDocuments(ALL_MEMORY);
                //load vectorDB
                vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
            }catch(e){
                console.error(e)
            }
        };

        export function query(search:string) {
            return run_query(search)
        };


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

        export async function streamingQuery(query:string){
            // To enable streaming, we pass in `streaming: true` to the LLM constructor.
            // Additionally, we pass in a handler for the `handleLLMNewToken` event.
            const chat = new OpenAI({
                maxTokens: 25,
                streaming: true,
            });

            const response = await chat.call(query, undefined, [
                {
                    handleLLMNewToken(token: any) {
                        console.log({ token });
                    },
                },
            ]);

            console.log(response);
        };

    }
};

export async function streamingQuery(query:string){
    // To enable streaming, we pass in `streaming: true` to the LLM constructor.
    // Additionally, we pass in a handler for the `handleLLMNewToken` event.
    const chat = new OpenAI({
        maxTokens: 25,
        streaming: true,
    });

    const response = await chat.call(query, undefined, [
        {
            handleLLMNewToken(token: any) {
                console.log({ token });
            },
        },
    ]);

    console.log(response);
};
