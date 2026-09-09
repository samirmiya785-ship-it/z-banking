const mongoose = require("mongoose");

const transcationSchema = new mongoose.Schema({
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transcation must be associated from an account"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transcation must be associated to an account"],
        index: true
    },
    status:{
        type: String,
        enum:{
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED"
        },
        default: "PENDING"
    },
    amount:{
        type: Number,
        required: [true, "Amount is required to make a transcation"],
        min: [0, "Transcation amount can never be Zero or Negative"]
    },
    idempotencyKey:{
        type: String,
        required: [true, "Idempontency Key is required to make a transcation"],
        index: true,
        unique: true
    }
},{
    timestamps: true
})

const transcationModel = mongoose.model("transcation", transcationSchema)
module.exports = transcationModel
