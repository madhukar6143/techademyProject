const exp = require("express");
const taskApi = exp.Router();
const expressErrorHandler = require("express-async-handler");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateDetails = require("../Module/validation");
const User =require('../Models/userSchema')

//core one no need to import

taskApi.use(exp.json());

//getting users cart data from mongodb database
taskApi.post(
  "/taskapp/register",
  expressErrorHandler(async (req, res) => {
    let newUser = req.body;

    if (newUser.password !== newUser.confirmPassword)
      res
        .status(422)
        .json({ message: "mismatched password and confirm password" });

    const validationError = validateDetails(newUser);
    if (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    let taskCollectionObject = req.app.get("taskCollectionObject");
    //search for existing users
    let user = await taskCollectionObject.findOne({
      username: newUser.username,
    });
    if (user != null) {
      return res.status(409).json({ message: "username already existed" });
    }
    user = await taskCollectionObject.findOne({ email: newUser.email });
    if (user != null) {
      return res.status(409).json({ message: "email already exist " });
    }

    let hashed = await bcryptjs.hash(newUser.password, 7);

    newUser.password = hashed;
    await taskCollectionObject.insertOne(newUser);
    res.status(200).send({ message: "User created" });
  })
);

//Cart Operations
//Inserting into cart from components

taskApi.post(
  "/taskapp/login",
  expressErrorHandler(async (req, res, next) => {
    let credentials = req.body;

    let taskCollectionObject = req.app.get("taskCollectionObject");
    let user = await taskCollectionObject.findOne({
      username: credentials.username,
    });
    if (user == null) {
      return res.send({ message: "Invalid username" });
    } else {
      let result = await bcryptjs.compare(credentials.password, user.password);
      if (result === false) {
        return res.send({ message: "Invalid password" });
      }

      //create token
      let tokened = jwt.sign({ username: credentials.username }, "abcdef", {
        expiresIn: 1000,
      });
      res.send({
        message: "Login successful",
        token: tokened,
        username: credentials.username,
      });
    }
  })
);

//Removing Items from Cart from Cart or Components
//getting users cart data from mongodb database
taskApi.get(
  "/taskapp/<username>/forgot",
  expressErrorHandler(async (req, res, next) => {
    console.log("attendence from get ");
    let myusername = req.params.username;
    let userList = await userCollectionsObj.findOne({ username: myusername });
    res.send({ message: userList.cart });
  })
);





taskApi.post(
  "/taskapp/:username",
  expressErrorHandler(async (req, res, next) => {
    let myusername = req.params.username;
    let taskToAdd = req.body;
    let taskCollectionObject = req.app.get("taskCollectionObject");
    let result =await taskCollectionObject.findOneAndUpdate(
      {
        username: myusername,
      },
      {
        $addToSet: {
          tasks: taskToAdd,
        },
      }
    );
    console.log(result)
     res.status(201).send({message:"task added"})
  })
 
);



taskApi.get("/taskapp/:username",expressErrorHandler(async(req,res,next)=>{
    console.log("attendence from get ")
      let myusername=req.params.username;
      let taskCollectionObject = req.app.get("taskCollectionObject");
      let taskList=await taskCollectionObject.findOne({username:myusername})   
      res.status(200).send({message:taskList.tasks})
  }))

//export module
module.exports = taskApi;

