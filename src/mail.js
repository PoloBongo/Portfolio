// const express = require("express");
// const nodemailer = require("nodemailer");
// const bodyParser = require("body-parser");

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Configure nodemailer
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "earthrp.polo@gmail.com", // replace with your email
//     pass: "Polo-arthur-polo-2004", // replace with your email password
//   },
// });

// // Handle form submission
// app.post("/submit-form", (req, res) => {
//   const { nom, prenom, mail, message } = req.body;

//   // Create email message
//   const mailOptions = {
//     from: "earthrp.polo@gmail.com",
//     to: "recipient_email@example.com", // replace with the recipient's email
//     subject: "New Form Submission",
//     text: `
//       Nom: ${nom}
//       Prénom: ${prenom}
//       Mail: ${mail}
//       Message: ${message}
//     `,
//   };

//   // Send email
//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       return res.status(500).send(error.toString());
//     }
//     res.status(200).send("Form submitted successfully!");
//   });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
