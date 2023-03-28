const exp = require("express");
const taskApi = exp.Router();
const expressErrorHandler = require("express-async-handler");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateDetails = require("../Module/validation");
const authMiddleware = require('../Module/authMiddleware')

require("dotenv").config();
const secretKey = process.env.SECRET_KEY;



//core one no need to import

taskApi.use(exp.json());

// This is a route for registering a new user
 // This is an error handler that wraps the entire function
taskApi.post("/taskapp/register",expressErrorHandler(async (req, res) => {
    let newUser = req.body;

    // Check that the password and confirm password fields match
    if (newUser.password !== newUser.confirmPassword)
      res.status(422).json({ message: "mismatched password and confirm password" });

      delete newUser.confirmPassword; 
    
    // Validate the details of the new user
    const validationError = validateDetails(newUser);
    if (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Get the task collection object from the app object
    let taskCollectionObject = req.app.get("taskCollectionObject");

    // Check if a user with the same username or email already exists
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

    // Hash the user's password using bcryptjs
    let hashed = await bcryptjs.hash(newUser.password, 7);
    newUser.password = hashed;
  
    // Insert the new user into the task collection
    await taskCollectionObject.insertOne(newUser);
    res.status(200).send({ message: "User created" });
  })
);



//This route is used to handle user login requests
taskApi.post("/taskapp/login", expressErrorHandler(async (req, res, next) => {
  let credentials = req.body;

  //get reference to the task collection object
  let taskCollectionObject = req.app.get("taskCollectionObject");
  
  //search for the user by username
  let user = await taskCollectionObject.findOne({
    username: credentials.username,
  });
  
  //if user not found, send an error response
  if (user == null) {
    return res.status(400).json({ message: "Invalid username" });
  } else {
    //if user is found, compare the entered password with the hashed password stored in the database
    let result = await bcryptjs.compare(credentials.password, user.password);
    
    //if password is invalid, send an error response
    if (result === false) {
      return res.status(400).json({ message: "Invalid password" });
    }
    
    //if password is valid, create a JWT token and send it as response along with a success message and username
    let tokened = jwt.sign({ username: credentials.username }, secretKey, {
      expiresIn: 1000,
    });
    res.status(200).send({
      message: "Login successful",
      token: tokened,
      username: credentials.username,
    });
  }
  })
  );
  
taskApi.post("/taskapp/:username/forgot", expressErrorHandler(async (req, res, next) => 
  {
    const { email } = req.body;

    // Get the task collection object from the app object
    let taskCollectionObject = req.app.get("taskCollectionObject");

    let user = await taskCollectionObject.findOne({ email: email });
    if (user == null) {
      return res.status(409).json({ message: "email not registered" });
    }


    // Create JWT token with user ID and secret key
    const token = jwt.sign({ userId: email }, secretKey, { expiresIn: '15m' });

    // Create transporter object with SMTP configuration
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'dummymail@gmail.com',
            pass: 'Dummypassword@1234"'
        }
    });

    // Set email options
    const mailOptions = {
        from: 'youremail@gmail.com',
        to: email,
        subject: 'Password Reset',
        html: `<p>Please click <a href="http://localhost:3000/reset-password/${token}">here</a> to reset your password.</p>`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Password reset email sent');
        }
    })
}));


// Route for resetting password
taskApi.post('/reset-password/:token', expressErrorHandler (async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Verify JWT token with secret key
  jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
          console.log(err);
          return res.status(401).send('Unauthorized');
      }

      // Find user with decoded user ID
      let user = taskCollectionObject.findOne({ email: decoded.email });
      
      // If user not found, return error response
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Update user password
      let hashed = await bcryptjs.hash(password.password, 7);


      const result = await taskCollectionObject.updateOne(
        { email: decode.email},
        { $set: { password: hashed } }
      );
      
      // Check if the update was successful
      if (result.modifiedCount === 1) {
        // Password updated successfully
      } else {
        // Failed to update password
      }

      // Return success response
      res.status(200).send('Password reset successfully');
  });
}
));



taskApi.post("/taskapp/:username/add",authMiddleware ,expressErrorHandler(async (req, res, next) => {
    let myusername = req.params.username;
    let taskToAdd = req.body;
    let task = req.body.task;
    if(task.length>120)
    return res.status(422).json({mesage:"task length exceeded 120 chacarteras please make it concise"})
    let taskCollectionObject = req.app.get("taskCollectionObject");
    let existingTask = await taskCollectionObject.findOne({
      username: myusername,
      tasks: {
        $elemMatch: {
          taskId: req.body.taskId,
        },
      },
    });

    if (existingTask) {
      // If taskId is already present in tasks array, return conflict message
      return res.status(409).send("Task ID already exists please choose other Id");
    }

    existingTask = await taskCollectionObject.findOne({
      username: myusername,
      tasks: {
        $elemMatch: {
          task: req.body.task,
        },
      },
    });
    if (existingTask) {
      return res.status(409).send("Same Task name  already exists please choose othet names to insert");
    }
    let result = await taskCollectionObject.findOneAndUpdate(
      {
        username: myusername,
      },
      {
        $addToSet: {
          tasks: taskToAdd,
        },
      }
    );

    console.log(result);
    res.status(201).send({ message: "New task added successfully" });
  })
);

// This endpoint updates a task for a given user and task id
taskApi.put("/taskapp/:username/update/:taskId",authMiddleware , expressErrorHandler(async (req, res, next) => {
  let myusername = req.params.username;
  let taskId = parseInt(req.params.taskId);
  // Get the new task information from the request body
  let taskToUpdate = req.body.task;
  if(taskToUpdate.length>120)
  return res.status(422).json({mesage:"task length exceeded 120 chacarteras please make it concise"})

  // Get the task collection object from the app object
  let taskCollectionObject = req.app.get("taskCollectionObject");

  let existingTask = await taskCollectionObject.findOne({
    username: myusername,
    tasks: {
      $elemMatch: {
        taskId: taskId,
      },
    },
  });

  if (!existingTask) {
    // If taskId not present return 404 message
    return res.status(404).send("Task ID not exists in database please enter correct Id to update");
  }


  // Check if the task already exists for the user
   existingTask = await taskCollectionObject.findOne({
    username: myusername,
    tasks: {
      $elemMatch: {
        task: req.body.task,
      },
    },
  });
  // If the task already exists, return a 409 conflict response
  if (existingTask) {
    return res.status(409).send("Task name  already exists please choose other name ");
  }

  // Find the task by user and task id and update it with the new task information
  let result = await taskCollectionObject.findOneAndUpdate(
    {
      username: myusername,
      "tasks.taskId": taskId,
    },
    {
      $set: {
        "tasks.$.task": taskToUpdate,
      },
    }
  );

  // Return a 201 created response
  res.status(201).send({ message: "Task update successfully" });
})
);



taskApi.delete("/taskapp/:username/delete/:taskId",authMiddleware ,expressErrorHandler(async (req, res, next) => {
    let myusername = req.params.username;
    let taskId = parseInt(req.params.taskId);

    let taskCollectionObject = req.app.get("taskCollectionObject");
    let existingTask = await taskCollectionObject.findOne({
      username: myusername,
      tasks: {
        $elemMatch: {
          taskId: taskId,
        },
      },
    });

    if (!existingTask) {
      return res.status(404).send("TaskId not found please enter correct Id");
    }

    let result = await taskCollectionObject.findOneAndUpdate(
      {
        username: myusername,
      },
      {
        $pull: {
          tasks: { taskId: taskId },
        },
      }
    );
    return res.status(200).send("Task deleted successfully");
  })
);

// GET request handler for fetching all tasks for a particular user
taskApi.get("/taskapp/:username/all",authMiddleware , expressErrorHandler(async (req, res, next) => 
{ 
  // Extract username from request params
    let myusername = req.params.username; 
    // Get task collection object from app object
    let taskCollectionObject = req.app.get("taskCollectionObject"); 
    // Find all tasks for the given username
    let taskList = await taskCollectionObject.findOne({ username: myusername }); 
    // Send back the tasks in the response
    res.status(200).send({ todo: taskList.tasks }); 
  })
);


//export module
module.exports = taskApi;
