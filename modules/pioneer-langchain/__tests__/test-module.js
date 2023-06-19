
require('dotenv').config()
require('dotenv').config({path:"../../../.env"})
require('dotenv').config({path:"./../../.env"})
require('dotenv').config({path:"../../../../.env"})



// import * as ai from '../dist/index.js'
// import {query} from "../dist/index.js";
let ai = require('../dist/index.js')

//create
let run_test = async function(){
    try{
        // let memory = ["data.txt"]
        // await ai.load(memory)
        // //run_test
        // let summary = await ai.query("give the key points of this talk on ledger issues")
        // console.log("summary: ",summary)

        //output as json
        // let input = "ETH Price: $1,666.18 (-3.59%) Gas: 20 Gwei Light Dim Dark Site Settings Ethereum Mainnet Ethereum Mainnet CN Beaconscan ETH2 Goerli Testnet Sepolia Testnet Sign In Home Blockchain Transactions Pending Transactions Contract Internal Transactions Beacon Deposits Beacon Withdrawals View Blocks Forked Blocks (Reorgs) Uncles Top Accounts Verified Contracts Tokens Top Tokens (ERC-20) Token Transfers (ERC-20) NFTs Top Mints Top NFTs Latest Trades Latest Transfers Latest Mints Resources Charts And Stats Top Statistics Directory Newsletter Knowledge Base Developers API Plans API Documentation Verify Contract Smart Contract Search Contract Diff Checker Vyper Online Compiler Bytecode to Opcode Broadcast Transaction More Tools & Services Discover more of Etherscan's tools and services in one place. Sponsored Tools Unit Converter Explore Gas Tracker DEX Tracker Node Tracker Label Cloud Domain Name Lookup Services Token Approvals Beta Verified Signature Blockscan Chat Beta Explorers Ethereum Mainnet Ethereum Mainnet CN Beaconscan ETH2 Goerli Testnet Sepolia Testnet Appearance & Settings Light Dim Dark Site Settings | Sign In The Ethereum Blockchain Explorer All Filters Addresses Tokens Name Tags Labels Websites Search Ad Ad Ad Ether Price $1,666.18 @ 0.06553 BTC (-3.59%) Market Cap $200,303,909,400.00 Transactions 2,000.99 M (13.1 TPS) Med Gas Price 20 Gwei ($0.70) Last Finalized Block 17487289 Last Safe Block 17487353 Transaction History in 14 days Ad Ad Ad Latest Blocks Block17487375 12 secs agoFee Recipient Fee Recipient: 0xe68...127145 txns in 12 secs0.06983 Eth0.06983 EthBlock17487374 24 secs agoFee Recipient 0x215393...a4775d6d175 txns in 12 secs0.02713 Eth0.02713 EthBlock17487373 36 secs agoFee Recipient Lido: Execution Layer Rewards Vault158 txns in 12 secs0.02641 Eth0.02641 EthBlock17487372 1 min agoFee Recipient Lido: Execution Layer Rewards Vault138 txns in 12 secs0.0155 Eth0.0155 EthBlock17487371 1 min agoFee Recipient builder0x69122 txns in 12 secs0.03846 Eth0.03846 EthBlock17487370 1 min agoFee Recipient Fee Recipient: 0xADa...31A139 txns in 12 secs0.04768 Eth0.04768 Eth View all blocks Latest Transactions TX#0x6bcead5ac8219f6b6c2fa594b9e9da314cd39f3eae83c1df66f0c434e309be4312 secs agoFrom 0x8C8D7C...564d7465To 0x93E48d...7bd1a34E0.04014 Eth0.04014 EthTX#0x716d09191d060b54e486e78e91e0a39ad20380595ba74298ebefb6f612e16b8612 secs agoFrom 0xC1b634...3Aec47ccTo 0x1c4796...E79582B60 Eth0 EthTX#0x9137ad84777a193dc3b6aaa394a71601d0d7bab08db656931846beb11307b1a012 secs agoFrom 0xd4A30b...6501e36ATo 0x000000...0aAF14dC0.0109 Eth0.0109 EthTX#0xce1de588280f705f563157c54a9b5fcb0a8b6fd457c449b17f99691c77318b6112 secs agoFrom 0xE415be...78A82d9dTo 0x8b4Fc3...63d0DC5C0.04298 Eth0.04298 EthTX#0x28b26e194d3127654a6f65cd6cce13ef146ce09cd46a2b8a57f1e6f3d7b7376412 secs agoFrom 0xb96696...46CaA87ATo 0x3fC91A...4B2b7FAD0 Eth0 EthTX#0xce8100e74c9ca6de8e55a9011a1f2976b8d5ad9613cf0d529a13667933fc9b3a12 secs agoFrom 0x98A6e6...0f43e97eTo 0xE4eDb2...A700bCE80.0186 Eth0.0186 Eth View all transactions × Back to Top Powered by Ethereum Etherscan is a Block Explorer and Analytics Platform for Ethereum, a decentralized smart contracts platform. Company About Us Brand Assets Contact Us Careers We're Hiring! Terms of Service Bug Bounty Community API Documentation Knowledge Base Network Status Newsletters Disqus Comments Products & Services Advertise Explorer-as-a-Service (EaaS) API Plans Priority Support Blockscan Blockscan Chat Etherscan © 2023 (F1) Donations: 0x71c765...d8976f This website uses cookies to improve your experience. By continuing to use this website, you agree to its Terms and Privacy Policy. Got it!"
        // let result = await ai.summarizeDapp(input)
        // console.log("result: ",result)

    }catch(e){
        console.error(e)
    }
}
run_test()


//write rivescript
