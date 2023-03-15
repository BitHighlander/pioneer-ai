declare let packageInfo: any;
declare const TAG: string;
declare const log: any;
declare const subscriber: any, publisher: any, redis: any, redisQueue: any;
declare const coincap: any;
declare const easterEggCommands: any;
declare let rebalance: any;
declare const Accounting: any;
declare const accounting: any;
declare const Tokenizer: any;
declare const tokenizer: any;
declare let queue: any;
declare let connection: any;
declare let wait: any;
declare let sleep: any;
declare let BOT_NAME: string;
declare const Configuration: any, OpenAIApi: any;
declare let OPENAI_API_KEY: string | undefined;
declare const configuration: any;
declare const openai: any;
declare const asciichart: any;
declare const usersDB: any;
declare let rive: any;
interface Data {
    query: string;
}
/***********************************************
 //        lib
 //***********************************************/
declare const help: () => string;
declare const deliberate_on_input: (session: any, data: Data, username: string) => Promise<any>;
declare let do_work: () => Promise<void>;
