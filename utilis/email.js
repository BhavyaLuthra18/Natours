const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Bhavya Luthra <${process.env.EMAIL_FROM}>`;
  }

  // easy to create different transports for different environments
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // create a transportor for sendGrid
      return nodemailer.createTransport({
        host: process.env.MAILGUN_HOST,
        port: process.env.MAILGUN_PORT,
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      //service:'Gmail' ,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // then auth property for authentication
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html) // text version of email
      //html:  can convert this message to html
    };
    // 3) Create a transport and send email
    const transporter = this.newTransport();
    await transporter.sendMail(mailOptions);
  }

  // one different function for each type of email that we want to send first one is setWelcome
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(valid for only 10 mins)'
    );
  }
};
