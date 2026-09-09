const mongoose = require('mongoose');
const DNS = require("dns");
DNS.setServers(["8.8.8.8"], ["8.8.4.4"]);
function connectDB() {
        mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Connected to Database");
        })    
        .catch((err) => {
            console.error("Error connecting to Database", err); 
            process.exit(1); // Exit the process with an error code
        })
}
module.exports = connectDB;