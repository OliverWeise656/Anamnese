const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

app.post('/send-email', upload.single('pdf'), (req, res) => {
    const pdfPath = req.file.path;

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'weise@hno-stuttgart.com',
        subject: 'Anamnese und Testergebnisse',
        text: 'Im Anhang finden Sie die Anamnese und die Testergebnisse.',
        attachments: [
            {
                filename: 'Anamnese_und_Testergebnisse.pdf',
                path: pdfPath
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        fs.unlinkSync(pdfPath); // Delete the file after sending
        if (error) {
            console.error('Error:', error);
            res.json({ success: false });
        } else {
            console.log('Email sent: ' + info.response);
            res.json({ success: true });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
