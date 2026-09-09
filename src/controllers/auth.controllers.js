const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenblacklistModel = require("../models/blacklist.model");

async function userRegisterController(req, res) {
  const { email, password, name } = req.body;
  const isExists = await userModel.findOne({
    email: email,
  });
  if (isExists) {
    return res.status(422).json({ message: "User already exists" });
  }
  const user = await userModel.create({
    email,
    password,
    name,
  });
  const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
  res.cookie("token", token);
  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.sendRegistrationEmail(user.email, user.name)

}
async function userLoginController(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Account doesnot exist" });
  }
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Account doesnot exist" });
  }
  const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
  res.cookie("token", token);
  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
  await emailService.sendLoginEmail(user.email, user.name)
}
async function userLogoutController(req, res){
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
  if(!token){
    return res.status(400).json({message: "Cannot logout"})
  }
  res.cookies("token", "")
  await tokenblacklistModel.create({
    token: token
  })
  res.clearCookie("token")
  res.status(200).json({
    message: "User logged-out Successfully"
  })
}
module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController
};
