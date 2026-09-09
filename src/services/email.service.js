require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Sameer" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
async function sendRegistrationEmail(userEmail, name){
    const subject = "Welcome to Z-Banking!!";
    const text = `Hello ${name},\n\nYou have been successfully registered at z-banking. 
    We are excited to have you on our web!\n\nBest Regards,\nZ-Banking Team `;
    const html = `<p>Hello ${name},</p><p>You have been successfully registered at z-banking. 
    We are excited to have you on our web!<\p><p>Best Regards,<br>Z-Banking Team</p> `;
    await sendEmail(userEmail, subject, text, html);
}
async function sendLoginEmail(userEmail, name){
    const subject = "Welcome to Z-Banking!!";
    const text = `Hello ${name},\n\nYou have been successfully logged in at z-banking. 
    We are excited to have you on our web!\n\nBest Regards,\nZ-Banking Team `;
    const html = `<p>Hello ${name},</p><p>You have been successfully logged in at z-banking. 
    We are excited to have you on our web!<\p><p>Best Regards,<br>Z-Banking Team</p> `;
    await sendEmail(userEmail, subject, text, html);
}
async function sendTranscationEmail(userEmail, name, amount, toAccount){
  const subject = "Transcation Successful";
  const text = `Hello ${name},\n\nYour Transcation from ${fromAccount} of $${amount} to account ${toAccount}have been successful\n\nBest Regards,\nZ-Banking Team `;
    const html = `<p>Hello ${name},</p><p>Your Transcation from ${fromAccount} of $${amount} to account ${toAccount}have been failed<\p><p>Best Regards,<br>Z-Banking Team</p> `;
    await sendEmail(userEmail, subject, text, html);
}


async function sendTranscationFailureEmail(userEmail, name, amount, toAccount){
  const subject = "Transcation Failed";
  const text = `Hello ${name},\n\nYour Transcation from ${fromAccount} of $${amount} to account ${toAccount}have been failed\n\nBest Regards,\nZ-Banking Team `;
    const html = `<p>Hello ${name},</p><p>Your Transcation from ${fromAccount} of $${amount} to account ${toAccount}have been failed<\p><p>Best Regards,<br>Z-Banking Team</p> `;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendTranscationEmail,
    sendTranscationFailureEmail
};