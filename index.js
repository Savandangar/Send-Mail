const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')
const puppeteer = require('puppeteer');
const path = require('path')
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const fs = require('fs');
const credentials = require('./credentials.json');
const tokens = require('./token.json');

const getGmailService = () => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
};

const encodeMessage = (message) => {
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createMail = async (options) => {
    const mailComposer = new MailComposer(options);
    const message = await mailComposer.compile().build();
    return encodeMessage(message);
};

async function createPDF() {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const website_url = 'http://127.0.0.1:5501/index1.html';

    await page.goto(website_url, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pdf = await page.pdf({
        path: `receipt.pdf`,
        margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
        printBackground: true,
        format: 'A4',
    });
    await browser.close();
}

const start = async () => {
    try {
        const app = express()
        app.use(cors())
        app.use(express.json())
        const port = 3000;

        app.listen({ port }, () =>
            console.log(`Server ready at http://localhost:${port}/send-mail`)
        )
        app.post('/send-email', async (req, res) => {
            const gmail = getGmailService();
            const pdf = await createPDF();
            const fileAttachments = [
                {
                    filename: 'receipt.pdf',
                    content: fs.createReadStream(path.join(__dirname, './receipt.pdf')),
                },
            ];

            options = {
                to: req.body.email,
                subject: 'Hello there',
                text: `This is your payment receipt.Thanks for participation.`,
                html: `<p>This is a <b>test email</b> from <a href="prakarsh.org">Prakarsh</a>.</p>`,
                attachments: fileAttachments,
                textEncoding: 'base64',

            };
        });


        const rawMessage = await createMail(options);
        const data = await gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: rawMessage,
            },
        });
        if (data) res.json({ status: 200, message: 'mail sent successfully' })
        try {
            fs.unlinkSync('receipt.pdf');

            console.log("Deleted File successfully.");
        } catch (error) {
            console.log(error);
        }


    }
    catch (e) {
        console.log(e)
    }
}
start();
