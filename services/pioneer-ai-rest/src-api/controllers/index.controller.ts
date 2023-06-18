/*

    REST endpoints

 */
let TAG = ' | API | '

const pjson = require('../../package.json');
const log = require('@bithighlander/loggerdog-client')()
const {subscriber, publisher, redis} = require('@pioneer-platform/default-redis')

let connection  = require("@pioneer-platform/default-mongo")
const knowledgeDB = connection.get('knowledge')
const tasksDB = connection.get('tasks')
const rivescriptDB = connection.get('rivescriptRaw')
const skillsDB = connection.get('skills')
const credentialsDB = connection.get('credentials')

//rest-ts
import { Body, Controller, Get, Post, Route, Tags, SuccessResponse, Query, Request, Response, Header } from 'tsoa';
import * as express from 'express';

//types
interface Error {
    success:boolean
    tag:string
    e:any
}

interface Health {
    online:boolean
    name:string
    version:string
    system:any
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
export class IndexController extends Controller {

    /*
        Health endpoint


    */

    @Get('/health')
    public async health() {
        let tag = TAG + " | health | "
        try{

            let status:any = await redis.hgetall("info:health")

            let output:Health = {
                online:true,
                name:pjson.name,
                version:pjson.version,
                system:status
            }

            return(output)
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

    /*
        Get user by address

     */
    @Get('/user/address/{address}')
    public async user(address:string) {
        let tag = TAG + " | user | "
        try{

            let status:any = await redis.hgetall("info:health")

            return(true)
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


    /*
        CRUD on skills
     */
    @Get('/skills')
    public async skills() {
        let tag = TAG + " | user | "
        try{

            let status:any = await skillsDB.find()

            return(status)
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

    // Create a skill
    @Post('/skills')
    public async createSkill(@Body() skill: any) {
        let tag = TAG + " | createSkill | "
        try {
            let createdSkill = await skillsDB.create(skill)
            return createdSkill
        } catch(e) {
            let errorResp:Error = {
                success: false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error", 503, "error: "+e.toString());
        }
    }

    // Update a skill
    @Post('/skills/:id')
    public async updateSkill(id: string, @Body() skill: any) {
        let tag = TAG + " | updateSkill | "
        try {
            let updatedSkill = await skillsDB.update({ _id: id }, skill)
            return updatedSkill
        } catch(e) {
            let errorResp:Error = {
                success: false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error", 503, "error: "+e.toString());
        }
    }

// Delete a skill
    @Post('/skills/:id/delete')
    public async deleteSkill(id: string) {
        let tag = TAG + " | deleteSkill | "
        try {
            let deletedSkill = await skillsDB.remove({ _id: id })
            return deletedSkill
        } catch(e) {
            let errorResp:Error = {
                success: false,
                tag,
                e
            }
            log.error(tag,"e: ",{errorResp})
            throw new ApiError("error", 503, "error: "+e.toString());
        }
    }




    /*
        Get Tasks
     */
    @Get('/tasks')
    public async tasks() {
        let tag = TAG + " | user | "
        try{

            let status:any = await tasksDB.find()

            return(status)
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

    /*
        Get Solutions
     */
    @Get('/solutions')
    public async solutions() {
        let tag = TAG + " | user | "
        try{

            let status:any = await knowledgeDB.find()

            return(status)
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






    /*
        Create user
     */

    /*
        generate deposit address

     */

    /*
        check deposit for payments

     */
}
