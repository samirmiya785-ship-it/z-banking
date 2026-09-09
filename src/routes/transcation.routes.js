const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const transcationController = require("../controllers/transcation.controller")

const transcationRoutes = express.Router();

transcationRoutes.post("/", authMiddleware.authMiddleware, transcationController.createTranscation)
transcationRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transcationController.createInitialFundsTranscation)
module.exports = transcationRoutes;