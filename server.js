const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/send-email', upload.single('pdf'), (req, res) => {
    const email = req.body.email;
    const file = req.file;

    let transporter = nodemailer.createTransport({
        service: 'protonmail', // Use the correct SMTP server for ProtonMail
        auth: {
            user: 'solm3@proton.me', // Your ProtonMail email
            pass: '#Silke1969!' // Your ProtonMail password
        }
    });

    let mailOptions = {
        from: 'your-email@protonmail.com',
        to: email,
        subject: 'Anamnese und Testergebnisse',
        text: 'Bitte finden Sie im Anhang die PDF-Datei mit den Anamnese- und Testergebnissen.',
        attachments: [
            {
                filename: 'Anamnese_und_Testergebnisse.pdf',
                path: file.path,
                contentType: 'application/pdf'
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Email sent: ' + info.response);
        fs.unlinkSync(file.path); // Delete the file after sending the email
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
