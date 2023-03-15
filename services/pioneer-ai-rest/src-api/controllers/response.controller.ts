/*

    REST endpoints

 */
let TAG = ' | API | '

const pjson = require('../../package.json');
const log = require('@bithighlander/loggerdog-client')()
const {subscriber, publisher, redis, redisQueue} = require('@pioneer-platform/default-redis')
let queue = require("@pioneer-platform/redis-queue")

//rest-ts
import { Body, Controller, Get, Post, Route, Tags, SuccessResponse, Query, Request, Response, Header } from 'tsoa';
import * as express from 'express';

//types
interface Error {
    success:boolean
    tag:string
    e:any
}

export class ApiError extends Error {
    private statusCode: number;
    constructor(name: string, statusCode: number, message?: string) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
    }
}

//route
@Route('')
export class ResponseController extends Controller {


    /*
     * register Affiliate
     *
     *
     *
     *
     * */
    @Post('/response')
    public async generateResponse(@Body() body: any): Promise<any> {
        let tag = TAG + " | generateResponse | "
        try{
            log.info(tag,"input body: ",body)
            if(!body.text) throw Error("address is required!")

            let event = {
                type:'update',
                queueId:"test123",
                username:'test123',
                text:body.text
            }
            let BOT_NAME = 'pioneer'
            let result = await queue.createWork("bots:"+BOT_NAME+":ingest",event)
            let BLOCKING_TIMEOUT_INVOCATION = 30000
            let response = await redisQueue.blpop(event.queueId,BLOCKING_TIMEOUT_INVOCATION)

            console.log(response)
            return response
        }catch(e){
            let errorResp:Error = {
                success:false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error",503,"error: "+e.toString());
        }
    }
}
