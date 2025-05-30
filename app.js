const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server); 

const chess = new Chess(); //Already a library, jisme chess ke jitne bhi rules h vo chess naam ke const me store ho gayi

let players = {};
let current = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index",{title:"Chess Game"});
})

io.on("connection", function(uniquesocket){
    console.log("Connected");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id===players.white){
            delete players.white;
        }
        else if(uniquesocket.id===players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn()==='w' && uniquesocket.id!==players.white) return; //This means agr turn white ka h and koi or us turn me apna koi chance chlne ka try kre, to vo return kr dega(mtlb vo chelga nahi)
            if(chess.turn()==='b' && uniquesocket.id!==players.black) return;

            const result = chess.move(move);
            if(result){ //Agr valid move h toh to player apna move chl payega
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen()) //fen() is the location of each gotiya on chessboard
            }
            else{
                console.log("Invald move: ",move);
                uniquesocket.move("Invalid move", move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("invalid move: ",move);
        }
    });

    // uniquesocket.on("churan", function(){
    //     // console.log("churan received") // backe-end pe churan receive hua
    //     io.emit("churan papdi") // sbko jayega , backe-end se front-end pe churan papdi bhejo
    // })
    /*socket.emit()=> Particular ek bande ko show hoga
    io.emit()=> sbko hoga*/
    // uniquesocket.on("disconnect",function(){
    //     console.log("disconnected");
    // })
});


server.listen(3000, function(){
    console.log("listening on port 3000");
})


