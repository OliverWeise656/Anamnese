const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/send-email', upload.single('pdf'), (req, res) => {
    const { email } = req.body;
    const pdfPath = req.file.path;
    const pdfFilename = req.file.originalname;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'youremail@gmail.com',
            pass: 'yourpassword'
        }
    });

    let mailOptions = {
        from: 'youremail@gmail.com',
        to: email,
        subject: 'Anamnese und Testergebnisse',
        text: 'Anbei finden Sie die Anamnese und Testergebnisse.',
        attachments: [
            {
                filename: pdfFilename,
                path: pdfPath
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        fs.unlinkSync(pdfPath); // Delete the file after sending it
        res.status(200).send('Email sent: ' + info.response);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
