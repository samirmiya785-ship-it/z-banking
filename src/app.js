const express = require('express');
const cookieParser = require("cookie-parser")

const authRoutes = require("./routes/auth.routes")
const accountRouter = require("./routes/acc.routes")
const transcationRoutes = require("./routes/transcation.routes")

const app = express();

app.use(express.json());
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/account", accountRouter)
app.use("/api/transcations", transcationRoutes)
module.exports = app;