const {publisher} = require("@pioneer-platform/default-redis");

let solver = {
    "solved":true,
    "solution":"KeepKey is a hardware wallet for securely storing digital assets like bitcoins. It generates and stores private keys using a hardware-based random number generator, and facilitates outgoing transactions. It is a subsidiary of ShapeShift and was acquired by the crypto exchange in 2017.",
}


let view  = {
    type:"task",
    data:solver,
    message:"test"
}

let payload = {
    channel:"1090511307524034642",
    responses:{
        sentences:[],
        views:[
            view
        ]
    }
}
publisher.publish('discord-bridge',JSON.stringify(payload))