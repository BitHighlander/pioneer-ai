/*
    CORE BRAINS of pioneer bot

 */
const TAG  = " | open-ai | "
const fs = require('fs-extra')
const log = require('@pioneer-platform/loggerdog')()
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
let OPENAI_API_KEY = process.env.OPENAI_API_KEY_4
if(!OPENAI_API_KEY) throw Error("missing OPENAI_API_KEY")
let configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


module.exports = {
    //Task Queue
    buildSummary:function(input:string, sessionInfo:any){
        return build_summary(input, sessionInfo)
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

//gpt3.5
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

//gpt3.5
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
        console.log("response: ",response.data.choices[0].text)
        return response.data.choices[0].text
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
        log.info(tag,"output (RAW): ",response.data.choices[0].text)
        let output = JSON.parse(response.data.choices[0].text)
        log.info(tag,"output FINAL (JSON): ",output)
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
        log.info(tag,"output (RAW): ",output)
        try {
            output = JSON.parse(output)
            if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
        } catch (err) {
            try{
                let parsedGptResp = await inputs_to_json(output,err)
                output = JSON.parse(parsedGptResp)
                if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
            }catch(e){
                log.info(tag, "Failed to parse JSON: ", err)
                throw Error(err)
            }
        }
        return output.inputs
    }catch(e){
        console.error(e)
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
//         log.info(tag,"output (RAW): ",output)
//         try {
//             output = JSON.parse(output)
//             if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
//         } catch (err) {
//             try{
//                 let parsedGptResp = await inputs_to_json(output,err)
//                 output = JSON.parse(parsedGptResp)
//                 if(!output.inputs) throw Error("no inputs found! expected {inputs:string[]}")
//             }catch(e){
//                 log.info(tag, "Failed to parse JSON: ", err)
//                 throw Error(err)
//             }
//         }
//         return output.inputs
//     }catch(e){
//         console.error(e)
//         throw Error(e)
//     }
// }

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
            log.info(tag,"output (RAW): ",response.data.choices[0].text)
            output = JSON.parse(response.data.choices[0].text)[0]
            log.info(tag,"output (JSON): ",output)
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
            max_tokens: 756,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        let output = response.data.choices[0].text
        log.info(tag,"output: ",output)

        let task = await steps_to_json(output)
        try {
            if(!task.summary) throw Error("Missing task.summary")
            if(!task.finalGoal) throw Error("Missing task.finalGoal")
            if(!task.keywords) throw Error("Missing task.keywords")
            if(!task.steps) throw Error("Missing task.steps")
            output = task
        } catch (err) {
            try{
                let parsedGptResp = await steps_to_json(output,err)
                if(!parsedGptResp.summary) throw Error("Missing task.summary")
                if(!parsedGptResp.finalGoal) throw Error("Missing task.finalGoal")
                if(!parsedGptResp.keywords) throw Error("Missing task.keywords")
                if(!parsedGptResp.steps) throw Error("Missing task.steps")
                output = JSON.parse(parsedGptResp)
            }catch(e){
                log.info(tag, "Failed to parse JSON: ", err)
                throw Error(err)
            }
        }
        return output
    }catch(e){
        console.error(e)
    }
}


//gpt3.5
const build_summary = async function(input:string, sessionInfo:any){
    let tag = TAG + " | build_summary | "
    try{

        let messages = [
            {
                role:"system",
                content:'summarize the text input. determine if they are asking for live data. return a json object with the struct { "summary": string, "externalQuery": string, "needsExternal": boolean, "keywords": string[] }'
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
        let output = null
        try {
            output = JSON.parse(response.data.choices[0].text)
        } catch (err) {
            try{
                let parsedGptResp = await validate_gpt_json_output(output,err)
                output = JSON.parse(parsedGptResp)
            }catch(e){
                log.info(tag, "Failed to parse JSON: ", err)
                throw Error(err)
            }
        }
        return output
    } catch(e){
        console.error(tag, "Error: ", e)
        throw Error(e)
    }
}



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