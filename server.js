const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const path = require("path");
const authRoutes = require("./routes/auth");

dotenv.config();

const connectDB = require("./config/database");

const app = express();

connectDB().catch(() => {
    console.log("MongoDB unavailable. Birthday journey will still run without database features.");
});

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(session({

    secret:process.env.SESSION_SECRET,

    resave:false,

    saveUninitialized:false

}));

app.use(express.static(path.join(__dirname,"public")));
app.use("/auth", authRoutes);

app.get("/",(req,res)=>{

    res.sendFile(path.join(__dirname,"views","home.html"));

});

app.get("/login",(req,res)=>{

    res.redirect("/");

});

const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{

    console.log(`🚀 Server Running : http://localhost:${PORT}`);

});
