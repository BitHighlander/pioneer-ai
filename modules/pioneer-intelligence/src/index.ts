/*
    CORE BRAINS of pioneer bot

 */
const TAG  = " | open-ai | "
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
    //Task Queue
    buildSummary:function(input:string, sessionInfo:any){
        return build_summary(input, sessionInfo)
    },

    buildWork:function(input:string, sessionInfo:any){
        return build_work(input, sessionInfo)
    },

    buildSolutionNoExternal:function(task:any){
        return build_solution_noExternal(task)
    },

    //worker delegation
    buildSolution:function(task:any){
        return build_solution_noExternal(task)
    },

    findInputs:function(inputs:any, task:string){
        return find_inputs(inputs, task)
    },

    //solver
    buildSolutionFinal:function(result:any, task:any){
        return build_solution(result, task)
    },

    //skill creation
    buildScript:function(output:string, context:string){
        return build_a_script(output, context)
    },

    validateOutput:function(output:string, e:any){
        return validate_gpt_json_output(output, e)
    }
}


/*****************************************
 // Primary
 //*****************************************/
let build_solution = async function(result:any, task:any){
    let tag = TAG+ " | build_solution | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a solutions bot. you create the solution by using the data to create the solution. solutions use the data provided intelligently and solve the task! "
            },
            {
                role:"system",
                content:'you always output in the following JSON stringifies format { "solution": string, "solved":boolean, "summary":string, "keywords":string[]}'
            },
            {
                role:"user",
                content:"result of the skill is: "+JSON.stringify(result)+" and the task im trying to solve is "+JSON.stringify(task)
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}

const build_a_script = async function(output:string, context:string){
    let tag = TAG+" | build_a_script | "
    try{
        log.info("build_a_script checkpoint : ",output)

        let messages = [
            {
                role:"system",
                content:"You are a skills creation bot. you write bash scripts that wrap clis. you find common CLIs that does usefull things and wrap them in bash scripts that format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself. to the output of the bash scripts is always in the following json format {success:boolean,output:string,summary:string}"
            },
            {
                role:"system",
                content:"you always output in the following format {script:string,inputsCount:number, inputs:[{position:number,name:string,description:string,example:string}],outputs:any, outputMap:{verbal descript of each field and what data in there},summary:string,keywords:string[]}"
            },
            {
                role:"system",
                content:" you never attach any extra characters or words. you never say result:  Here's a bash script that... you only output the json outputs, you review the script to verify it will parse to json closely. if needed you will escape ticks in the bash script to make sure it parses json via JSON.parse correctly. you never forget to put a shabam at the top of the bash script. or words around the output. it is pure stringifies json. the script field of the output must be a stringifies version of a bash script. of there are any install commands needed you must add them inside the bash script."
            },
            {
                role:"system",
                content:"Bash Scripts are always written for MacOS"
            },
            {
                role:"system",
                content:" you always double check that the ouput script is valid and will parse. you prevent errors like  Unexpected token $ in JSON at position 39 by escaping the ticks in the bash script. you always double check that the ouput script is valid and will parse. you prevent errors like  Unexpected token $ in JSON at positions by escaping the ticks in the bash script."
            },
            {
                role:"user",
                content:"context info: "+context
            },
            {
                role:"user",
                content:"user requests you: "+output
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        // console.log("response: ",response.data.choices[0])
        // console.log("response: ",response.data.choices[0].message.content)
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}

//test
let validate_gpt_json_output = async function(output:string, e:any){
    let tag = TAG+ " | validate_gpt_json_output | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a cleanup bot. you take the output of a gpt-4 chatbot and clean it up. you remove all the system messages. you remove all the user messages. you remove all the content that is not a JSON response. you evaluate all fields of the JSON to verify it will parse with JSON. stringify without error. you never change any content"
            },
            {
                role:"system",
                content:"you always output in the following format {script:string,inputsCount:number, inputs:[{position:number,name:string,description:string,example:string}],outputs:any, outputMap:{verbal descript of each field and what data in there},summary:string,keywords:string[]}"
            },
            {
                role:"user",
                content:"the error was e: "+e.toString()
            },
            {
                role:"user",
                content:output
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}


let find_inputs = async function(inputs:any, task:string){
    let tag = TAG+ " | find_inputs | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a input finder bot. You review a task and provide a solution. the solution is a set of inputs into a executable script. inputs are an array of strings. the strings are the values passed to the exec."
            },
            {
                role:"system",
                content:'you always output in the following JSON stringifies format { "inputs": string[]}'
            },
            {
                role:"user",
                content:"inputs the the skill needed: "+JSON.stringify(inputs)+" and the task im trying to solve is "+task+" build a set of inputs that will solve this task"
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}

let build_solution_noExternal = async function(task:any){
    let tag = TAG+ " | build_solution | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a solver bot. You review a task and solve it"
            },
            {
                role:"user",
                content:"the task im trying to solve is "+JSON.stringify(task)
            }
        ]

        //log.info(tag,"messages: ",messages)
        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);
        return response.data.choices[0].message.content
    }catch(e){
        console.error(e)
    }
}

const build_work = async function(data:any, summary:any){
    let tag = TAG + " | build_work | "
    try{

        let messages = [
            {
                role:"system",
                content:"analyze the requested task, break it down into small steps for a process worker. each step should be specific and achievable with a single api request or script processing the data. You always are prepaired for changes in the returned data and never assume you know how data will be formed, you create scripts that review returned data and find what you are looking for and confirm its correct."
            },
            {
                role:"system",
                content:"The output will go to JSON.stringify, verify the output is valid and parseable. never add ..., never cuttoff entries. return a json object with the struct { summary: string, keywords:string[] finalGoal: string, steps: steps: steps:[{ type:string, input: string, action:string  }] }"
            },
            {
                role:"user",
                content:data.text
            },
            {
                role:"assistant",
                content:"summary: "+JSON.stringify(summary)
            }
        ]

        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        console.log("response: ",response.data.choices[0])
        console.log("response: ",response.data.choices[0].message.content)
        return JSON.parse(response.data.choices[0].message.content)
    }catch(e){
        console.error(e)
    }
}

const build_summary = async function(input:string, sessionInfo:any){
    let tag = TAG + " | build_summary | "
    try{

        let messages = [
            {
                role:"system",
                content:"summarize the text input. determine if they are asking for live data. return a json object with the struct { summary: string, externalQuery: string, needsExternal: boolean, keywords: string[] }"
            },
        ]

        //session
        for(let i = 0; i < sessionInfo.length; i++){
            let messageInfo = sessionInfo[i]
            log.debug(tag,"messageInfo: ",messageInfo)
            if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
                log.debug(tag," I think the session is valid! ")
                log.debug(tag,"messageInfo.username: ",messageInfo.username)
                log.debug(tag,"messageInfo.output: ",messageInfo.output)
                messages.push({
                    role:"user",
                    content: messageInfo.text
                })
                messages.push({
                    role:"assistant",
                    content: messageInfo.output.sentences.toString()
                })
            } else {
                log.error(tag,"invalid messageInfo: ",messageInfo)
            }
        }
        messages.push({ role: 'user', content:  input })

        //
        let body = {
            model: "gpt-4",
            messages,
        }
        let response = await openai.createChatCompletion(body);

        // console.log("response: ",response.data)
        console.log("response: ",response.data.choices[0])
        console.log("response: ",response.data.choices[0].message.content)
        return JSON.parse(response.data.choices[0].message.content)
    }catch(e){
        console.error(e)
    }
}

//GPT3
// const deliberate_on_input = async function(messages:any){
//     const tag = " | deliberate_on_input | "
//     try{
//         let output:any = {}
//         output.views = []
//         output.sentences = []
//
//         //convert messages to prompt
//
//         let body = {
//             model: "text-davinci-003",
//             prompt: data.query+"\n\n",
//             temperature: 0.7,
//             max_tokens: 756,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//         }
//
//         const response = await openai.createCompletion(body);
//         // console.log("response: ",response)
//         // console.log("response: ",response.data)
//         // console.log("response: ",response.data.choices)
//         // console.log("response: ",response.data.choices[0])
//         output.sentences = response.data.choices[0].text
//
//
//         return output
//     }catch(e){
//         console.error(e)
//     }
// }