
require('dotenv').config()
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../../.env"})



// import * as ai from '../dist/index.js'
// import {query} from "../dist/index.js";
let client = require('../dist/index.js')


//create
let run_test = async function(){
    try{

        // let input = "what is the nonce for address 0x651982e85D5E43db682cD6153488083e1b810798"
        // let queryKey = "key:337e39de-3f45-40ac-ace0-d60684d2b92f"
        // let result = await client.query(queryKey,input)
        // console.log("result: ",result)



    }catch(e){
        console.error(e)
    }
}
run_test()


//write rivescript
