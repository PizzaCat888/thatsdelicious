const nodemailer = require("nodemailer"); //interface with SMTP. Sends emails for you
const pug = require("pug");
const juice = require("juice"); //in;ines css for us
const htmlToText = require("html-to-text"); //converts html to text
const promisify = require("es6-promisify");

//where our email will go
const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

//Convert pug to html using pug package.
const generateHTML =(filename, options = {}) => {
    const html = pug.renderFile(`{$__dirname}/../views/email/${filename}.pug`, options)
    const inlined = juice(html)
    return inlined;
}

// transport.sendMail({
//     from: "Jack <dagon2345@hotmail.com>",
//     to: "bob@hotmail.com",
//     subject: "Does this work?",
//     html: "Hey, whats up <strong>BUDDY?</strong>",
//     text: "Hey, how are you?"
// });

exports.send = async(options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html)
    const mailOptions = {
        from: `Jack Lin <dagon2345@hotmail.com>`,
        to: options.user.email,
        subject: options.subject,
        html: html,
        text: text
    };
    const sendMail = promisify (transport.sendMail, transport);
    return sendMail(mailOptions);
}