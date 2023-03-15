
let rive = require('../lib')

// let run_test = async function(){
//     try{
//         //run_test
//         await rive.initialize()
//         let response = await rive.respond("hello")
//         console.log("response: ",response)
//     }catch(e){
//         console.error(e)
//     }
// }
// run_test()

//create
let run_test = async function(){
    try{
        //run_test
        await rive.initialize()
        let response = await rive.respond("hello")
        console.log("response: ",response)
    }catch(e){
        console.error(e)
    }
}
run_test()


//read

//update

//delete