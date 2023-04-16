import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

// connecting mongoDb
mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName : "backend"
}).then(()=>(console.log("in then"))).catch(()=>console.log("in catch"));

// creating a schema(a format of how the things will be stored in the databese)
const Schema = new mongoose.Schema(
    {
        name : String,
        email : String 
    }
)
const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String,
})
// creating a collection with the schema which is created above 
const Message = mongoose.model("messages" , Schema);
const user = mongoose.model("user", userSchema);

const app = express();
const privateKey = "dfjsdkljfklasdglkdsf"


app.set('view engine', 'EJS');
// Using Middlewares 
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(path.resolve(),"public")))
app.use(cookieParser());

// showing something at the /about endpoint
app.get("/",async (req,res) =>{
    const  newCookie = req.cookies.newCookie
    if(newCookie){
        const decoded = jwt.verify(newCookie, privateKey);
   
        const using = await user.findById(decoded._id);
       
        res.render("logout.ejs",{name : using.name});

    }
    else{
        res.render("register.ejs",{arr : "sachin"})
    }
})



app.post("/register", async (req,res) => {
    const {name , email, password} = req.body
    const alreadyExist = await user.findOne({email : email});
    if(!alreadyExist){
    const hashedPassword = await bcrypt.hash(password,10);
    const newUser = await user.create({
        name,
        email,
        password : hashedPassword
    })
    const token = jwt.sign({_id : newUser._id} , privateKey);
    res.cookie("newCookie",token)
    res.redirect("/");
    } 
    else{
       res.redirect("/login");
    }
})


app.get("/login", (req,res) => {
    res.render("login.ejs")
})

app.post("/login",async (req,res) => {
    const {email,password} = req.body
    const isOldUser = await user.findOne({email : email})
    if(isOldUser){
        const isMatched = await bcrypt.compare(password, isOldUser.password);
        if(isMatched){
            const token = jwt.sign({_id : isOldUser._id},privateKey) 
            res.cookie("newCookie" , token)
            res.redirect("/");
        }
        else{
            return res.render("login",{email , msg : "Incorrect Password"});
       
        }
    }
    else{
        res.redirect("/");
    }
})


app.post("/logout", (req,res) => {
    res.cookie("newCookie",null , {
        expires : new Date(Date.now())
    })
    res.redirect("/");
})




// listen at the 3000 port
app.listen(3000, ()=>{
    console.log("Server is working");
})