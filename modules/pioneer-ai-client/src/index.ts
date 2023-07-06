/*
    Pioneer AI client

    Make AI calls to Pioneer server
 */
const TAG = " | pioneer-ai-client | "
let connection = require("@pioneer-platform/default-mongo")
// const markets = require('@pioneer-platform/markets')
let usersDB = connection.get('users')
let pubkeysDB = connection.get('pubkeys')
let txsDB = connection.get('transactions')
let invocationsDB = connection.get('invocations')
let utxosDB = connection.get('utxo')
let devsDB = connection.get('developers')
let blockchainsDB = connection.get('blockchains')
let dappsDB = connection.get('apps')
let nodesDB = connection.get('nodes')
let assetsDB = connection.get('assets')
let insightDB = connection.get('insight')

usersDB.createIndex({id: 1}, {unique: true})
usersDB.createIndex({username: 1}, {unique: true})
txsDB.createIndex({txid: 1}, {unique: true})
utxosDB.createIndex({txid: 1}, {unique: true})
pubkeysDB.createIndex({pubkey: 1}, {unique: true})
invocationsDB.createIndex({invocationId: 1}, {unique: true})
txsDB.createIndex({invocationId: 1})

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

let get_mongo_tools = async function(){
    try{
        let tools:any = []

        //mongo tools
        const findByName = async (name: string, runManager?: CallbackManagerForToolRun) => {
            // Your custom code here
            log.info("input: ",name)
            let results = await dappsDB.find({name});
            return JSON.stringify(results);
        };

        const findDappsByName: DynamicToolInput = {
            name: "mongoQuery",
            description: "find a dapp by a name",
            func: findByName,
        };
        tools.push(new DynamicTool(findDappsByName))

        // Find nodes by blockchain symbol
        const findNodesBySymbol = async (symbol: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const nodes = await nodesDB.find({ symbol });
            return JSON.stringify(nodes);
        };

        const findNodesBySymbolInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find nodes by blockchain symbol",
            func: findNodesBySymbol,
        };
        tools.push(new DynamicTool(findNodesBySymbolInput));

        // Find nodes by tags
        const findNodesByTags = async (tags: string[], runManager?: CallbackManagerForToolRun): Promise<string> => {
            const nodes = await nodesDB.find({ tags: { $in: tags } });
            return JSON.stringify(nodes);
        };

        const findNodesByTagsInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find nodes by tags",
            func: findNodesByTags,
        };
        tools.push(new DynamicTool(findNodesByTagsInput));

        // Find nodes by fuzzy search in description
        const findNodesByDescription = async (description: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const nodes = await nodesDB.find({ description: { $regex: description, $options: "i" } });
            return JSON.stringify(nodes);
        };

        const findNodesByDescriptionInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find nodes by fuzzy search in description",
            func: findNodesByDescription,
        };
        tools.push(new DynamicTool(findNodesByDescriptionInput));

        // Find assets by blockchain symbol
        const findAssetsBySymbol = async (symbol: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const assets = await assetsDB.find({ symbol });
            return JSON.stringify(assets);
        };

        const findAssetsBySymbolInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find assets by blockchain symbol",
            func: findAssetsBySymbol,
        };
        tools.push(new DynamicTool(findAssetsBySymbolInput));

        // Find assets by tags
        const findAssetsByTags = async (tags: string[], runManager?: CallbackManagerForToolRun): Promise<string> => {
            const assets = await assetsDB.find({ tags: { $in: tags } });
            return JSON.stringify(assets);
        };

        const findAssetsByTagsInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find assets by tags",
            func: findAssetsByTags,
        };
        tools.push(new DynamicTool(findAssetsByTagsInput));

        // Find assets by fuzzy search in description
        const findAssetsByDescription = async (description: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const assets = await assetsDB.find({ description: { $regex: description, $options: "i" } });
            return JSON.stringify(assets);
        };

        const findAssetsByDescriptionInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find assets by fuzzy search in description",
            func: findAssetsByDescription,
        };
        tools.push(new DynamicTool(findAssetsByDescriptionInput));

        // Find blockchains by symbol
        const findBlockchainsBySymbol = async (symbol: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const blockchains = await blockchainsDB.find({ symbol });
            return JSON.stringify(blockchains);
        };

        const findBlockchainsBySymbolInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find blockchains by symbol",
            func: findBlockchainsBySymbol,
        };
        tools.push(new DynamicTool(findBlockchainsBySymbolInput));

        // Find blockchains by tags
        const findBlockchainsByTags = async (tags: string[], runManager?: CallbackManagerForToolRun): Promise<string> => {
            const blockchains = await blockchainsDB.find({ tags: { $in: tags } });
            return JSON.stringify(blockchains);
        };

        const findBlockchainsByTagsInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find blockchains by tags",
            func: findBlockchainsByTags,
        };
        tools.push(new DynamicTool(findBlockchainsByTagsInput));

        // Find blockchains by fuzzy search in description
        const findBlockchainsByDescription = async (description: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
            const blockchains = await blockchainsDB.find({ description: { $regex: description, $options: "i" } });
            return JSON.stringify(blockchains);
        };

        const findBlockchainsByDescriptionInput: DynamicToolInput = {
            name: "mongoQuery",
            description: "Find blockchains by fuzzy search in description",
            func: findBlockchainsByDescription,
        };
        tools.push(new DynamicTool(findBlockchainsByDescriptionInput));


        return tools
    }catch(e){
        log.error(e)
    }
}

const get_pioneer_tools = async (pioneer: any) => [
    {
        name: "getNonce",
        description: "This function takes an ETH address and returns the nonce",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const nonce = await pioneer.GetNonce({ address: input });
            return nonce.data;
        },
    },
    {
        name: "getPioneerHealth",
        description: "This returns Pioneer's health status of its API and tells if Pioneer is online or offline",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const health = await pioneer.Health();
            return JSON.stringify(health.data);
        },
    },
    {
        name: "getGlobals",
        description: "This function returns Pioneer's global information",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const globals = await pioneer.Globals();
            return JSON.stringify(globals.data);
        },
    },
    {
        name: "getCurrenciesChangelly",
        description: "This function returns the list of supported currencies for Changelly",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const currencies = await pioneer.CurrenciesChangelly();
            return JSON.stringify(currencies.data);
        },
    },
    {
        name: "getStatus",
        description: "This function returns Pioneer's status information",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const status = await pioneer.Status();
            return JSON.stringify(status.data);
        },
    },
    {
        name: "getInvocation",
        description: "This function takes an invocation as input and returns the result",
        func: async (input: string, runManager?: CallbackManagerForToolRun) => {
            const invocation = input; // Set the actual invocation parameter from the input
            const result = await pioneer.Invocation(invocation);
            return JSON.stringify(result.data);
        },
    },
    // {
    //     name: "listUnspentBTC",
    //     description: "This function returns the list of unspent transactions for Bitcoin",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const list = await pioneer.ListUnspent({ network: 'BTC', xpub: input });
    //         return JSON.stringify(list.data);
    //     },
    // },
    // {
    //     name: "listUnspentBCH",
    //     description: "This function returns the list of unspent transactions for Bitcoin Cash",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const list = await pioneer.ListUnspent({ network: 'BCH', xpub: input });
    //         return JSON.stringify(list.data);
    //     },
    // },
    // {
    //     name: "listUnspentLTC",
    //     description: "This function returns the list of unspent transactions for Litecoin",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const list = await pioneer.ListUnspent({ network: 'LTC', xpub: input });
    //         return JSON.stringify(list.data);
    //     },
    // },
    // {
    //     name: "listUnspentDOGE",
    //     description: "This function returns the list of unspent transactions for Dogecoin",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const list = await pioneer.ListUnspent({ network: 'DOGE', xpub: input });
    //         return JSON.stringify(list.data);
    //     },
    // },
    // {
    //     name: "listUnspentDASH",
    //     description: "This function returns the list of unspent transactions for Dash",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const list = await pioneer.ListUnspent({ network: 'DASH', xpub: input });
    //         return JSON.stringify(list.data);
    //     },
    // },
    // {
    //     name: "getAccountInfoETH",
    //     description: "This function takes an ETH address and returns the account information",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const info = await pioneer.instance.GetAccountInfo({ network: 'ETH', address: input });
    //         return JSON.stringify(info.data);
    //     },
    // },
    // {
    //     name: "getAccountInfoBNB",
    //     description: "This function takes a BNB address and returns the account information",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const info = await pioneer.instance.GetAccountInfo({ network: 'BNB', address: input });
    //         return JSON.stringify(info.data);
    //     },
    // },
    // {
    //     name: "getAccountInfoOSMO",
    //     description: "This function takes an OSMO address and returns the account information",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const info = await pioneer.instance.GetAccountInfo({ network: 'OSMO', address: input });
    //         return JSON.stringify(info.data);
    //     },
    // },
    // {
    //     name: "getAccountInfoATOM",
    //     description: "This function takes an ATOM address and returns the account information",
    //     func: async (input: string, runManager?: CallbackManagerForToolRun) => {
    //         const info = await pioneer.instance.GetAccountInfo({ network: 'ATOM', address: input });
    //         return JSON.stringify(info.data);
    //     },
    // }
].map((tool) => new DynamicTool(tool));

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

        let tools:any = await get_mongo_tools()
        tools = tools.concat(await get_pioneer_tools(pioneer))
        // let tools:any = await get_pioneer_tools(pioneer)

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
