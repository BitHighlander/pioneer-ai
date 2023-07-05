/*
    Pioneer AI client

    Make AI calls to Pioneer server
 */
const TAG = " | pioneer-ai-client | "
// import { BabyAGI } from "langchain/experimental/babyagi";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { OpenAIEmbeddings } from "langchain/embeddings/openai";
// import { OpenAI } from "langchain/llms/openai";
// import { PromptTemplate } from "langchain/prompts";
// import { LLMChain } from "langchain/chains";
// import { ChainTool, SerpAPI, Tool } from "langchain/tools";
// import { initializeAgentExecutorWithOptions } from "langchain/agents";
// @ts-ignore
import { OpenAI } from "langchain/llms/openai";
// @ts-ignore
import { DynamicTool, DynamicToolInput, CallbackManagerForToolRun } from "langchain/tools";
// @ts-ignore
import { ChatOpenAI } from "langchain/chat_models/openai";
// @ts-ignore
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import {
    RequestsGetTool,
    RequestsPostTool,
    AIPluginTool,
    // @ts-ignore
} from "langchain/tools";

const log = require('@pioneer-platform/loggerdog')()
let pioneerApi = require("@pioneer-platform/pioneer-client")

// process.env['URL_PIONEER_SPEC'] = "https://pioneers.dev/spec/swagger.json"
process.env['URL_PIONEER_SPEC'] = "http://127.0.0.1:9001/spec/swagger.json"
let spec = process.env['URL_PIONEER_SPEC']

module.exports = {
    //Task Queue
    query:function(queryKey:string, input:string){
        return run_query(queryKey, input)
    }

}

let run_query = async function(queryKey:string, input:string){
    let tag = TAG + " | run_query | "
    try{
        let config = {
            queryKey,
            spec
        }
        //get config
        let pioneer = new pioneerApi(spec,config)
        pioneer = await pioneer.init()

        let paths = Object.keys(pioneer.api.definition.paths)
        let dataMap = {}
        for(let i = 0; i < paths.length; i++){
            // log.info("paths[i]: ",paths[i])
            let pathInfo = pioneer.api.definition.paths[paths[i]]
            // log.info("pathInfo: ",pathInfo)
            // log.info("pathInfo: ",JSON.stringify(pathInfo))
            // @ts-ignore
            // if(pathInfo.post){
            //     // @ts-ignore
            //     dataMap[pathInfo.post.operationId] = pathInfo.post
            // }
            if(pathInfo.get && pathInfo.get.description){
                // @ts-ignore
                dataMap[pathInfo.get.operationId] = pathInfo.get
            }
        }
        // log.info("dataMap: ",dataMap)

        // let tools = []
        // let methods = Object.keys(pioneer)
        // for(let i = 0; i < methods.length; i++){
        //     let method = methods[i]
        //     if (method[0] === method[0].toUpperCase()) {
        //         // First letter is uppercase, do something
        //         // @ts-ignore
        //         if(dataMap[method] && dataMap[method].description){
        //             console.log(method);
        //             let tool = new DynamicTool({
        //                 name: method,
        //                 // @ts-ignore
        //                 description: dataMap[method].description,
        //                 func: async () =>
        //                     new Promise(async (resolve) => {
        //                         try{
        //                             log.info("Calling function ",method)
        //                             let result = await pioneer[method]()
        //                             // let result = await pioneer.Health()
        //                             log.info(tag, "result: ",result.data)
        //                             resolve(JSON.stringify(result.data));
        //                         }catch(e){
        //                             resolve("no information here, try another query");
        //                         }
        //                     }),
        //             })
        //             tools.push(tool)
        //         }
        //
        //     }
        // }

        // let tools:any = []
        // const myFunction = async (input: string, runManager?: CallbackManagerForToolRun) => {
        //     // Your custom code here
        //     log.info("input: ",input)
        //     return `your input was ${input + new Date().getTime()}, Run Manager: ${runManager}`;
        // };
        //
        // const myTool: DynamicToolInput = {
        //     name: "MyTool",
        //     description: "This is a dynamic tool with parameters, it will add the current time to the input",
        //     func: myFunction,
        // };
        //
        // tools.push(new DynamicTool(myTool));

        //
        let tools:any = []
        const myFunction = async (input: string, runManager?: CallbackManagerForToolRun) => {
            // Your custom code here
            log.info("input: ",input)
            console.log("input: ",input)
            let nonce = await pioneer.GetNonce({address:input})
            return nonce.data;
        };

        const myTool: DynamicToolInput = {
            name: "getNonce",
            description: "this function intakes an ETH address and return the nonce",
            func: myFunction,
        };

        tools.push(new DynamicTool(myTool));

        const model = new OpenAI({
            // modelName: "gpt-4-0613",
            temperature: 0
        });
        //
        const executor = await initializeAgentExecutorWithOptions(tools, model, {
            agentType: "zero-shot-react-description",
            verbose: true
        });

        const result = await executor.call({ input });
        return result
    }catch(e){
        log.error(e)
    }
}
