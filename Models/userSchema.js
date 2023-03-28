const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    id: {
      type: Number,
      unique: true
    },
    task: String
  });
  
  const userSchema = new Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    password: String,
    contactNumber: String,
    tasks: [taskSchema]
  });
  

module.exports = mongoose.model('User', userSchema);
