const exp=require("express")
const app=exp();
const path = require("path")
const bodyParser = require("body-parser");
const mongoClient=require("mongodb").MongoClient;
require("dotenv").config();
const dbConnectionString= process.env.URL;

 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: false }));
 
 


app.get("/", (req, res) => {
    res.send("Home page");
  });
  


  

//connect to DB
mongoClient.connect(dbConnectionString)
.then(client=>{
  //create DB object
  const dbObj=client.db("techademy");
  //get collection object
  const taskCollectionObject=dbObj.collection("taskcollection")
  //share userCollectionObj
  app.set("taskCollectionObject",taskCollectionObject)
  

  console.log("Connected to DB successfully")
})
.catch(err=>console.log("err in connecting to DB ",err))



//connecting front end to backend

const taskApi=require("./APIS/taskApi")
//importing
app.use("/api/v1.0",taskApi)




app.use((req,res)=>{
    console.log(req.path,"invlauid")
    res.send({message:`Path ${req.path} is invalid`})
})

app.use((err,req,res,next)=>{
    res.send({message:`${err.message}`})
})

const port=5000
app.listen(port,()=>console.log(`Server can hear you on ${port}....`))