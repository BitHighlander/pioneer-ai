declare let BOT_NAME: string;
declare let packageInfo: any;
declare const TAG: string;
declare const util: any;
declare const log: any;
declare const subscriber: any, publisher: any, redis: any, redisQueue: any;
declare const short: any;
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
declare let ai: any;
declare const Configuration: any, OpenAIApi: any;
declare let OPENAI_API_KEY: string | undefined;
declare let configuration: any;
declare const openai: any;
declare const exec: any;
declare const asciichart: any;
declare const usersDB: any;
declare let conversations: any;
declare const knowledgeDB: any;
declare const rivescriptDB: any;
declare const skillsDB: any;
declare const credentialsDB: any;
declare let fs: any;
interface Data {
    query: string;
    queueId: string;
    admin: boolean;
    dm: boolean;
    user: string;
    username: string;
    channel: string;
    text: string;
    discordName?: string;
    discordId?: string;
    sessionId?: string;
    sessionInfo?: any;
    messageId?: string;
    output?: {
        views: any;
        sentences: any;
    };
}
interface Skill {
    inputs: any;
    outputs: any;
    script: string;
    summary: string;
    keywords: string[];
}
/***********************************************
 //        lib
 //***********************************************/
declare const save_skill: (skill: Skill) => Promise<{
    created: number;
    skillId: string;
    script: string;
    description: string;
    keywords: string[];
}>;
declare let do_work: () => Promise<void>;
