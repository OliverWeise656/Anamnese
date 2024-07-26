const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

app.post('/send-pdf', (req, res) => {
  const { email, pdfBase64 } = req.body;

  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const filePath = path.join(__dirname, 'Anamnese_und_Testergebnisse.pdf');

  fs.writeFile(filePath, pdfBuffer, (err) => {
    if (err) {
      return res.status(500).send('Error saving PDF');
    }

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Anamnese und Testergebnisse',
      text: 'Anbei finden Sie Ihre Anamnese und Testergebnisse.',
      attachments: [
        {
          filename: 'Anamnese_und_Testergebnisse.pdf',
          path: filePath
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send('Error sending email');
      }
      res.send('Email sent: ' + info.response);
    });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
