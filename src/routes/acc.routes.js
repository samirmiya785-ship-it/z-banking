const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware")
const accountController = require("../controllers/acc.controller")

const router = express.Router();
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)
// Get all the logged-in user's account
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)
// get the account balance
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)
module.exports = router;