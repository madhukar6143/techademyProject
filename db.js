const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Connected to database!');
  })
  .catch((error) => {
    console.log('Database connection failed!');
    console.error(error);
  });

module.exports = mongoose;
