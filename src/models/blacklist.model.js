const mongoose = require("mongoose");


const tokenblacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true,"Token should be provided"],
        unique: true
    },
    
},{
    timestamps: true
})

tokenblacklistSchema.index({
    createdAt: 1
},
{
    expireAfterSeonds: 60*60*24*30
})

const tokenblacklistModel = mongoose.model("tokenblacklist", tokenblacklistSchema);

module.exports = tokenblacklistModel;