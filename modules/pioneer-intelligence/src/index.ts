/*
    CORE BRAINS of pioneer bot

 */
const TAG  = " | open-ai | "
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
let OPENAI_API_KEY = process.env.OPENAI_API_KEY
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

module.exports = {
    init:function(apiKey:string){
        openai = new OpenAIApi(configuration);
        //openai = new OpenAI({key: process.env.OPENAI_KEY});
        return true
    },

    //Task Queue
    buildSummary:function(input:string, sessionInfo:any, context:any){
        return build_summary(input, sessionInfo, context)
    },

    buildTask:function(summary:string){
        return build_task(summary)
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
    buildScript:function(objective:string, input:string, output:string, context:any){
        return build_a_script(objective, input, output, context)
    },

    //skill creation
    fixScript:function(script:string, issue:string, context:any){
        return fix_a_script(script, issue, context)
    },

    validateOutput:function(output:string, e:any){
        return validate_gpt_json_output(output, e)
    },

    summarizeString:function(input:string, schema:any){
        return summarize_string_to_schema(input, schema)
    },

    //analyze data
    analyzeData:function(input:any, objective:string, schema:any){
        return analyize_input(input, objective, schema)
    }
}


/*****************************************
 // Primary
 //*****************************************/

let analyize_input = async function(input:any, objective:string, schema:any){
    let tag = TAG+ " | summarize_string_to_schema | "
    try{
        let messages = [
            {
                role:"system",
                content:objective
            },
            {
                role:"system",
                content:' you only output valid JSON in this format: '+JSON.stringify(schema)
            },
            {
                role:"user",
                content:"the data is: "+JSON.stringify(input)
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
        //loop until its valid

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

// let summarize_dapp = async function(website:string) {
//     try {
//         // Define the structured output parser
//         const parserConfig = {
//             name: "name of the DApp",
//             app: "official app of the DApp",
//             blockchains: "blockchains supported by the DApp, listed as a CSV",
//             // protocols: {
//             //     walletConnect: "boolean indicating if the DApp supports WalletConnect",
//             //     walletConnectV2: "boolean indicating if the DApp supports WalletConnect V2"
//             // },
//             image: "logo of the DApp",
//             // developer: {
//             //     address: "developer's address of the DApp",
//             //     email: "developer's email of the DApp"
//             // },
//             keepKeySupport: "boolean indicating if the DApp supports KeepKey",
//             shapeShiftSupport: "boolean indicating if the DApp supports ShapeShift",
//             facts: "facts about the DApp including signer, payload, and signature",
//             description: "brief description of the DApp",
//             homepage: "official website of the DApp",
//             // created: "creation time of the DApp",
//             // trust: "trust score of the DApp",
//             // transparency: "transparency score of the DApp",
//             // innovation: "innovation score of the DApp",
//             // popularity: "popularity score of the DApp",
//             // socialMedia: {
//             //     twitter: "Twitter handle of the DApp",
//             //     telegram: "Telegram handle of the DApp",
//             //     facebook: "Facebook page of the DApp",
//             //     linkedin: "LinkedIn page of the DApp",
//             //     github: "Github repository of the DApp"
//             // },
//             // token: {
//             //     name: "name of the token used by the DApp",
//             //     symbol: "symbol of the token used by the DApp",
//             //     contractAddress: "smart contract address of the token"
//             // },
//             // license: "license type under which the DApp is released",
//             // sourceCodeLink: "link to the DApp's source code",
//             // userCount: "number of users using the DApp",
//             // transactionCount: "number of transactions processed by the DApp"
//         };
//         console.log("input length: ",website.length)
//         const parser = StructuredOutputParser.fromNamesAndDescriptions(parserConfig);
//
//         const formatInstructions = parser.getFormatInstructions();
//
//         const prompt = new PromptTemplate({
//             template:
//                 "Answer the users question as best as possible.\n{format_instructions}\n{question}",
//             inputVariables: ["question"],
//             partialVariables: { format_instructions: formatInstructions },
//         });
//
//         const model = new OpenAI({ temperature: 0 });
//
//         const input = await prompt.format({
//             question: "ready the text and find the values for "+JSON.stringify(parserConfig)+ " the website: " + website,
//         });
//         const response = await model.call(input);
//
//         console.log(input);
//
//
//         console.log(response);
//         /*
//         {"answer": "Paris", "source": "https://en.wikipedia.org/wiki/Paris"}
//         */
//
//         console.log(await parser.parse(response));
//
//         // Generate the string for prompt dynamically
//         // const jsonPrompt = `Given the following input: "${input}", construct a JSON object that contains the ${JSON.stringify(parserConfig)}.`;
//
//         // const parser = StructuredOutputParser.fromNamesAndDescriptions(parserConfig);
//         //
//         // const formatInstructions = parser.getFormatInstructions();
//         //
//         // const model = new OpenAI({ temperature: 0 });
//         //
//         // const input = "summarize the content best as possible.\n{format_instructions}\n{question}";
//         // const prompt = new PromptTemplate({
//         //     template: input,
//         //     inputVariables: ["question"],
//         //     partialVariables: { format_instructions: formatInstructions },
//         // });
//         //
//         // const response = await model.generate(prompt.format({ question: website }), {
//         //     max_tokens: 2048, // set max_tokens to a larger value to allow for larger outputs
//         // });
//         //
//         // console.log(response);
//
//         // let jsonResult = await openai.call(jsonPrompt,{max_tokens: 4096});
//         // console.log("OpenAI JSON Result: ", jsonResult); // Log result for debugging
//         //
//         // // Check if jsonResult is empty
//         // if (!jsonResult || jsonResult.trim() === '') {
//         //     throw new Error("OpenAI returned an empty JSON result");
//         // }
//         // try{
//         //     jsonResult = JSON.parse(jsonResult)
//         // }catch(e){
//         //     console.error("Failed to parse: ",e)
//         // }
//
//         return response;
//     } catch(e) {
//         console.error("Error during summarizing DApp: ", e);
//         return null;
//     }
// }
//

//gpt3.5
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

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let output
        let JSON_FAILURES = 0

    }catch(e){
        console.error(e)
    }
}

//gpt3.5
let validate_gpt_json_output = async function(input:string, e?:any){
    let tag = TAG+ " | validate_gpt_json_output | "
    try{
        let messages = [
            {
                role:"system",
                content:"You are a JSON formatting bot bot. you take the output of a gpt-4 chatbot and clean it up into valid JSON. you move all the system messages and intelligently put them into json fields. you remove all the user messages. you remove all the content that is not a JSON response. you evaluate all fields of the JSON to verify it will parse with JSON otherwise you fix it. stringify without error. you never change any content"
            },
            {
                role:"system",
                content:'you always output in the following format, but extra fields are allowed {"scriptName":string,"script":string,"inputsCount":number, "inputs":[{"position":number,"name":string,"description":string,"example":string}],"outputs":any, "outputMap":{name:string,description:string},summary:string,keywords:string[]}'
            },
            {
                role:"system",
                content:'summary output is never empty.'
            },
            {
                role:"system",
                content:'you never return system messages into output, nor user messages.'
            },
            {
                role:"user",
                content:"here is my bash script: " + input
            }
        ]
        if(e) {
            messages.push({
                role:"user",
                content:"the error given was e: "+e.toString()
            })
        }

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let output
        let JSON_FAILURES = 0
        try{
            log.info(tag,"output (PRE): ",response.data.choices[0].text)
            output = JSON.parse(response.data.choices[0].text)
            log.info(tag,"resultFormated (OUTPUT): ",output)
            if(output && output[0] && output[0].script) output = output[0]
            //sometimes there are two
            if(output && output[0] && output.length > 1){
                for(let i = 0; output.length > i; i++){
                    if(output[i].script) output = output[i]
                }
            }
            log.info(tag,"chosen output (OUTPUT): ",output)
            output.validJSON = true
            log.info(tag,"validJSON: ",output.validJSON)
            //verify json is correct format
            // if(!resultFormated.inputs) throw Error("Invalid output! missing inputs")
            if(!output.scriptName) throw Error("Invalid output! missing scriptName")
            if(!output.script) throw Error("Invalid output! missing script")
            if(!output.summary) throw Error("Invalid output! missing summary")
            if(!output.keywords) throw Error("Invalid output! missing keywords")
            if(!output.inputs) throw Error("Invalid output! missing keywords")

            for(let i = 0; output.inputs < i; i++){
                if(!output.inputs[i].position) throw Error("Invalid inputs! input:"+i+" is missing position")
                if(!output.inputs[i].name) throw Error("Invalid inputs! input:"+i+" missing name")
                if(!output.inputs[i].description) throw Error("Invalid inputs! input:"+i+" missing description")
                if(!output.inputs[i].example) throw Error("Invalid inputs! input:"+i+" missing example")
            }
        }catch(e){
            JSON_FAILURES = JSON_FAILURES + 1
            log.info("FAILURE!! count: "+JSON_FAILURES+" e: ",e)
            await sleep(1000) //rate 1/sec
            validate_gpt_json_output(input,e)
        }
        return output
    }catch(e){
        log.error(e)
        throw e
    }
}

//gpt3.5
const fix_a_script = async function(script:string, issue:string, context:any){
    let tag = TAG+" | fix_a_script | "
    try{
        log.debug("fix_a_script checkpoint : ",script)

        let messages = [
            {
                role:"system",
                content:"You are a bash script fixer bot. you write bash scripts that leverage all programming languages and clis you know about. you find common code that does usefull things and wrap them in bash scripts. you build these bashscript to format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself."
            },
            {
                role:"system",
                content:"Bash Scripts are always written for "+os.platform()+" and "+os.arch()+" architecture"
            },
            {
                role:"user",
                content:"this is the script you are fixing: "+script
            },
            {
                role:"user",
                content:"the issue with script is: "+JSON.stringify(issue)
            },
            {
                role:"user",
                content:"extra context: "+context
            }
        ]

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        log.debug("OUTPUT (PRE JSON)!",response.data.choices[0].text)
        let output
        try{
            output = await validate_gpt_json_output(response.data.choices[0].text)
        }catch(e){
            //try again
            fix_a_script(script, issue, context)
        }
        return output
    }catch(e){
        console.error(e)
    }
}

//gpt3.5
const build_a_script = async function(objective:string, input:string, outputs:string, context:string){
    let tag = TAG+" | build_a_script | "
    try{
        log.info("build_a_script checkpoint : ",objective)
        if(typeof input === "object") input = JSON.stringify(input)
        let messages = [
            {
                role:"system",
                content:"You are a bash script creation bot. you write bash scripts that leverage all programming languages and clis you know about. you find common code that does usefull things and wrap them in bash scripts. you build these bashscript to format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself. you create a clever name and name it scriptName of what it does and is very short and put it on top the response and label it."
            },
            {
                role:"system",
                content:"Bash Scripts are always written for "+os.platform()+" and "+os.arch()+" architecture"
            },
            // {
            //     role:"user",
            //     content:"context info: "+context
            // },
            {
                role:"user",
                content:"create a bash script that objective: "+objective+" inputs: "+input+" outputs: "+outputs+" context: "+context
            }
        ]

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        log.info("OUTPUT (PRE JSON)!",response.data.choices[0].text)
        let output
        try{
            output = await validate_gpt_json_output(response.data.choices[0].text)
        }catch(e){
            //try again
            build_a_script(objective,input,output,context)
        }
        return output
    }catch(e){
        console.error(e)
    }
}


//gpt3.5
const inputs_to_json = async function(input:string,err?:any){
    let tag = TAG + " | inputs_to_json | "
    try{

        let messages = [
            {
                role:"system",
                content:"You are a cleanup bot. you take the output of a gpt-3 chatbot and clean it up. you remove all the system messages. you remove all the user messages. you remove all the content that is not a JSON response. you evaluate all fields of the JSON to verify it will parse with JSON. stringify without error. you never change any content"
            },
            {
                role:"system",
                content:'you always output in the following JSON stringifies format { "inputs": string[]}'
            },
            {
                role:"system",
                content:'never return Answer: ...and json string, just return the json string'
            },
            {
                role:"system",
                content:'only have one input never multiple elements in the array'
            },
            {
                role:"user",
                content:"gpt output you need to clean: "+JSON.stringify(input)
            }
        ]
        if(err){
            messages.push({
                role:"user",
                content:"the error was e: last time "+err.toString()
            })
        }

        //gpt3.5
        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        log.debug(tag,"output (RAW): ",response.data.choices[0].text)
        let output = JSON.parse(response.data.choices[0].text)
        log.debug(tag,"output FINAL (JSON): ",output)
        return output.inputs
    }catch(e){
        log.error(tag,e)
        throw Error(e)
    }
}

/*

 */
let find_inputs = async function(skill:any, task:any){
    let tag = TAG + " | find_inputs | "
    try{

        // TASK
        if(!task.finalGoal) throw Error("invalid task.finalGoal missing")

        // Skill
        if(!skill.summary) throw Error("invalid skill.summary missing")

        let messages:any = [
            {
                role:"system",
                content:"You are an task completion bot. You review a task and provided, find relevant information in the task action field. and apply that task action to the input template."
            },
            // {
            //     role:"system",
            //     content:'only have one input never multiple elements in the array'
            // },
            // {
            //     role:"system",
            //     content:'you always output in the following JSON stringifies format { "inputs": string[]}'
            // },
            // {
            //     role:"system",
            //     content:'never return Answer: ...and json string, just return the json string'
            // },
            {
                role:"system",
                content:"The final goal of this task is to "+task.finalGoal
            },
            {
                role:"system",
                content:"You have the skill to "+skill.summary
            },
            {
                role:"system",
                content:"to you use this skill you need to output the inputs needed to this script"
            },
            {
                role:"system",
                content:'you always output in the following JSON stringifies format { "inputs": string[]}'
            },
            // {
            //     role:"user",
            //     content:"the task im trying to solve is "+JSON.stringify(task)+" populate the needed input from the task using the template of the inputs needed for the skill"
            // }
        ]

        //for inputs
        for(let i = 0; i < skill.inputs.length; i++){
            messages.push({
                role:"user",
                content:"input "+i+" is "+skill.inputs[i].description
            })
        }

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 1756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let output = response.data.choices[0].text
        log.debug(tag,"output (RAW): ",output)
        try {
            output = JSON.parse(output)
            if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
        } catch (err) {
            try{
                let parsedGptResp = await inputs_to_json(output,err)
                output = JSON.parse(parsedGptResp)
                if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
            }catch(e){
                log.debug(tag, "Failed to parse JSON: ", err)
                throw Error(err)
            }
        }
        return output.inputs
    }catch(e){
        console.error(e)
        throw Error(e)
    }
}

//gpt3.5
let build_solution_noExternal = async function(task:any){
    let tag = TAG+ " | build_solution_noExternal | "
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

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        //console.log("response: ",response.data.choices[0].text)
        return response.data.choices[0].text
    }catch(e){
        console.error(e)
    }
}

//gpt3.5
const steps_to_json = async function(input:string,err?:any){
    let tag = TAG + " | steps_to_json | "
    try{

        let messages = [
            {
                role:"system",
                content:"You are a cleanup bot. you take the output of a gpt-4 chatbot and clean it up. you remove all the system messages. you remove all the user messages. you remove all the content that is not a JSON response. you evaluate all fields of the JSON to verify it will parse with JSON. stringify without error. you never change any content"
            },
            {
                role:"system",
                content:'The output will go to JSON.stringify, verify the output is valid and parseable. never add ..., never cuttoff entries. return a json object with the struct { "summary": string, "keywords":string[] "finalGoal": string, "steps": [{ "type":string, "inputs": string[], "action":string, "summary":string, "complete":false, keywords: string[]  }] }'
            },
            {
                role:"user",
                content:"gpt output you need to clean: "+input
            }
        ]
        if(err){
            messages.push({
                role:"user",
                content:"the error was e: last time "+err.toString()
            })
        }

        //gpt3.5
        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let output
        try{
            log.debug(tag,"output (RAW): ",response.data.choices[0].text)
            output = JSON.parse(response.data.choices[0].text)[0]
            log.debug(tag,"output (JSON): ",output)
        }catch(e){
            steps_to_json(response.data.choices[0].text,e)
        }
        return output
    }catch(e){
        console.error(e)
    }
}

//gpt3.5
const build_task = async function(summary:any){
    let tag = TAG + " | build_task | "
    try{

        let messages = [
            {
                role:"system",
                content:"analyze the requested task, break it down into small steps for a process worker. each step should be specific and achievable with a single api request or script processing the data. You always are prepared for changes in the returned data and never assume you know how data will be formed, you create scripts that review returned data and find what you are looking for and confirm its correct."
            },
            {
                role:"assistant",
                content:"summary: "+JSON.stringify(summary)
            }
        ]

        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        // let output = response.data.choices[0].text
        // log.debug(tag,"output: ",output)
        // log.info("OUTPUT (PRE JSON)!",response.data.choices[0].text)
        let output
        try{
            output = await steps_to_json(response.data.choices[0].text)
        }catch(e){
            //try again
            steps_to_json(response.data.choices[0].text,e)
        }
        return output
        // let task = await steps_to_json(output)
        // try {
        //     if(!task.summary) throw Error("Missing task.summary")
        //     if(!task.finalGoal) throw Error("Missing task.finalGoal")
        //     if(!task.keywords) throw Error("Missing task.keywords")
        //     if(!task.steps) throw Error("Missing task.steps")
        //     output = task
        // } catch (err) {
        //     try{
        //         let parsedGptResp = await steps_to_json(output,err)
        //         if(!parsedGptResp.summary) throw Error("Missing task.summary")
        //         if(!parsedGptResp.finalGoal) throw Error("Missing task.finalGoal")
        //         if(!parsedGptResp.keywords) throw Error("Missing task.keywords")
        //         if(!parsedGptResp.steps) throw Error("Missing task.steps")
        //         output = JSON.parse(parsedGptResp)
        //     }catch(e){
        //         log.debug(tag, "Failed to parse JSON: ", err)
        //         throw Error(err)
        //     }
        // }
        // return output
    }catch(e){
        console.error(e)
    }
}


//gpt3.5
const build_summary = async function(input:string, sessionInfo:any, context:any){
    let tag = TAG + " | build_summary | "
    try{
        if(sessionInfo && typeof sessionInfo != "string") sessionInfo = JSON.stringify(sessionInfo)
        if(context && typeof context != "string") context = JSON.stringify(context)
        let messages = [
            {
                role:"system",
                content:'summarize the text input. use the knowledge and if possible just solve with it. analyize the context for intent. determine if they are asking for live data. return a json object with the struct { "summary": string, isSolved: boolean, solution?:string, "externalQuery": string, "needsExternal": boolean, "needsExecution": boolean, "keywords": string[] }'
            },
            {
                role:"user",
                content:"sessionInfo: "+sessionInfo
            },
            {
                role:"system",
                content:"my knowledge on the subject is: "+context
            },
            {
                role:"user",
                content:"the text input is: "+input
            }
        ]

        //TODO session context
        // for(let i = 0; i < sessionInfo.length; i++){
        //     let messageInfo = sessionInfo[i]
        //     log.debug(tag,"messageInfo: ",messageInfo)
        //     if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
        //         log.debug(tag," I think the session is valid! ")
        //         log.debug(tag,"messageInfo.username: ",messageInfo.username)
        //         log.debug(tag,"messageInfo.output: ",messageInfo.output)
        //         messages.push({
        //             role:"user",
        //             content: messageInfo.text
        //         })
        //         messages.push({
        //             role:"assistant",
        //             content: messageInfo.output.sentences.toString()
        //         })
        //     } else {
        //         log.error(tag,"invalid messageInfo: ",messageInfo)
        //     }
        // }
        log.info("messages: ",messages)
        let prompt = JSON.stringify(messages)+"\n\n"
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let output = null
        try {
            output = JSON.parse(response.data.choices[0].text)
        } catch (err) {
            try{
                let parsedGptResp = await validate_gpt_json_output(output,err)
                output = JSON.parse(parsedGptResp)
            }catch(e){
                log.debug(tag, "Failed to parse JSON: ", err)
                throw Error(err)
            }
        }
        return output
    } catch(e){
        console.error(tag, "Error: ", e)
        throw Error(e)
    }
}

// let find_inputs = async function(inputs:any, task:string){
//     let tag = TAG+ " | find_inputs | "
//     try{
//         let messages:any = [
//             {
//                 role:"system",
//                 content:"You are an input builder bot. You review a task and provided, find relevant information in the task action field. and apply that task action to the input template. for instance input:'the content of the query' would turn into 'news about an event in Moscow today'"
//             },
//             // {
//             //     role:"system",
//             //     content:"You are a input builder bot. You review a task and provide a relevant input for the script. the solution is a set of inputs into a executable script. inputs are an array of strings. the strings are the values passed to the exec. for instance action: 'Search for latest news about an event in Moscow today', and template input of {\n" +
//             //         "position\n" +
//             //         "1\n" +
//             //         "name\n" +
//             //         "\"searchParams\"\n" +
//             //         "description\n" +
//             //         "\"the content of the query\"\n" +
//             //         "example\n" +
//             //         "\"what is a keepkey?\"} would have an input of [\"news about an event in Moscow today\"] you NEVER NEVER NEVER use the example as the result! never! the sample value will never be a valid output for a calculated input!"
//             // },
//             {
//                 role:"system",
//                 content:'only have one input never multiple elements in the array'
//             },
//             {
//                 role:"system",
//                 content:'you always output in the following JSON stringifies format { "inputs": string[]}'
//             },
//             {
//                 role:"system",
//                 content:'never return Answer: ...and json string, just return the json string'
//             },
//             // {
//             //     role:"user",
//             //     content:"Template of the type of inputs needed for this skill: "+JSON.stringify(inputs)
//             // },
//             {
//                 role:"user",
//                 content:"the task im trying to solve is "+JSON.stringify(task)+" populate the needed input from the task using the template of the inputs needed for the skill"
//             }
//         ]
//
//         let prompt = JSON.stringify(messages)+"\n\n"
//         const response = await openai.createCompletion({
//             model: "text-davinci-003",
//             prompt,
//             temperature: 0.7,
//             max_tokens: 1756,
//             top_p: 1,
//             frequency_penalty: 0,
//             presence_penalty: 0,
//         });
//         let output = response.data.choices[0].text
//         log.debug(tag,"output (RAW): ",output)
//         try {
//             output = JSON.parse(output)
//             if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
//         } catch (err) {
//             try{
//                 let parsedGptResp = await inputs_to_json(output,err)
//                 output = JSON.parse(parsedGptResp)
//                 if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
//             }catch(e){
//                 log.debug(tag, "Failed to parse JSON: ", err)
//                 throw Error(err)
//             }
//         }
//         return output.inputs
//     }catch(e){
//         console.error(e)
//         throw Error(e)
//     }
// }

// const build_summary = async function(input:string, sessionInfo:any){
//     let tag = TAG + " | build_summary | "
//     try{
//
//         let messages = [
//             {
//                 role:"system",
//                 content:"summarize the text input. determine if they are asking for live data. return a json object with the struct { summary: string, externalQuery: string, needsExternal: boolean, keywords: string[] }"
//             },
//         ]
//
//         //session
//         for(let i = 0; i < sessionInfo.length; i++){
//             let messageInfo = sessionInfo[i]
//             log.debug(tag,"messageInfo: ",messageInfo)
//             if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
//                 log.debug(tag," I think the session is valid! ")
//                 log.debug(tag,"messageInfo.username: ",messageInfo.username)
//                 log.debug(tag,"messageInfo.output: ",messageInfo.output)
//                 messages.push({
//                     role:"user",
//                     content: messageInfo.text
//                 })
//                 messages.push({
//                     role:"assistant",
//                     content: messageInfo.output.sentences.toString()
//                 })
//             } else {
//                 log.error(tag,"invalid messageInfo: ",messageInfo)
//             }
//         }
//         messages.push({ role: 'user', content:  input })
//
//         //
//         let body = {
//             model: "gpt-4",
//             messages,
//         }
//         let response = await openai.createChatCompletion(body);
//
//         // console.log("response: ",response.data)
//         console.log("response: ",response.data.choices[0])
//         console.log("response: ",response.data.choices[0].message.content)
//         return JSON.parse(response.data.choices[0].message.content)
//     }catch(e){
//         console.error(e)
//     }
// }

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

//TODO move these to mongo/Long term memory
//retires skills
// const build_summary = async function(input:string, sessionInfo:any){
//     let tag = TAG + " | build_summary | "
//     try{
//
//         let messages = [
//             {
//                 role:"system",
//                 content:"summarize the text input. determine if they are asking for live data. return a json object with the struct { summary: string, externalQuery: string, needsExternal: boolean, keywords: string[] }"
//             },
//         ]
//
//         //session
//         for(let i = 0; i < sessionInfo.length; i++){
//             let messageInfo = sessionInfo[i]
//             log.debug(tag,"messageInfo: ",messageInfo)
//             if(messageInfo.username && messageInfo.output && messageInfo.output.sentences){
//                 log.debug(tag," I think the session is valid! ")
//                 log.debug(tag,"messageInfo.username: ",messageInfo.username)
//                 log.debug(tag,"messageInfo.output: ",messageInfo.output)
//                 messages.push({
//                     role:"user",
//                     content: messageInfo.text
//                 })
//                 messages.push({
//                     role:"assistant",
//                     content: messageInfo.output.sentences.toString()
//                 })
//             } else {
//                 log.error(tag,"invalid messageInfo: ",messageInfo)
//             }
//         }
//         messages.push({ role: 'user', content:  input })
//
//         //
//         let body = {
//             model: "gpt-4",
//             messages,
//         }
//         let response = await openai.createChatCompletion(body);
//
//         // console.log("response: ",response.data)
//         console.log("response: ",response.data.choices[0])
//         console.log("response: ",response.data.choices[0].message.content)
//         return JSON.parse(response.data.choices[0].message.content)
//     }catch(e){
//         console.error(e)
//     }
// }

// const build_work = async function(data:any, summary:any){
//     let tag = TAG + " | build_work | "
//     try{
//
//         let messages = [
//             {
//                 role:"system",
//                 content:"analyze the requested task, break it down into small steps for a process worker. each step should be specific and achievable with a single api request or script processing the data. You always are prepaired for changes in the returned data and never assume you know how data will be formed, you create scripts that review returned data and find what you are looking for and confirm its correct."
//             },
//             {
//                 role:"system",
//                 content:"The output will go to JSON.stringify, verify the output is valid and parseable. never add ..., never cuttoff entries. return a json object with the struct { summary: string, keywords:string[] finalGoal: string, steps: steps: steps:[{ type:string, input: string, action:string  }] }"
//             },
//             {
//                 role:"user",
//                 content:data.text
//             },
//             {
//                 role:"assistant",
//                 content:"summary: "+JSON.stringify(summary)
//             }
//         ]
//
//         //
//         let body = {
//             model: "gpt-4",
//             messages,
//         }
//         let response = await openai.createChatCompletion(body);
//
//         // console.log("response: ",response.data)
//         console.log("response: ",response.data.choices[0])
//         console.log("response: ",response.data.choices[0].message.content)
//         return JSON.parse(response.data.choices[0].message.content)
//     }catch(e){
//         console.error(e)
//     }
// }

//test
// let build_solution = async function(task:any){
//     let tag = TAG+ " | build_solution | "
//     try{
//         let messages = [
//             {
//                 role:"system",
//                 content:"You are a solver bot. You review a task and solve it"
//             },
//             {
//                 role:"user",
//                 content:"the task im trying to solve is "+JSON.stringify(task)
//             }
//         ]
//
//         //log.debug(tag,"messages: ",messages)
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

// let find_inputs = async function(inputs:any, task:string){
//     let tag = TAG+ " | find_inputs | "
//     try{
//         let messages = [
//             {
//                 role:"system",
//                 content:"You are a input finder bot. You review a task and provide a solution. the solution is a set of inputs into a executable script. inputs are an array of strings. the strings are the values passed to the exec."
//             },
//             {
//                 role:"system",
//                 content:'you always output in the following JSON stringifies format { "inputs": string[]}'
//             },
//             {
//                 role:"user",
//                 content:"inputs the the skill needed: "+JSON.stringify(inputs)+" and the task im trying to solve is "+task+" build a set of inputs that will solve this task"
//             }
//         ]
//
//         //log.debug(tag,"messages: ",messages)
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
