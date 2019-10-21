// import nodemailer from 'nodemailer';
// //process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// const transporter = nodemailer.createTransport({
//   host: "mail.kemsu.ru",
//   auth: {
//     user: 'openedu',
//     pass: 'D1rtyL1ttle$ecret'
//   },
//   tls: {
//     rejectUnauthorized: false
//   }
// });

// export async function sendEmail(email, html) {
//   try {
//     const result = await transporter.sendMail({
//       from: 'openedu@kemsu.ru', 
//       to: email,
//       html
//     });
//     return result;
//   } catch (error) {
//     throw error;
//   }
// }

import sendmail from 'sendmail';
import { sitename } from './config';
import fs from 'fs';

const privateKey = fs.readFileSync('./dkim-private.pem');
const dkim = {
  domainName: 'kemsu.ru',
  privateKey,
  keySelector: 'openedu'
};

const _sendEmail = sendmail({
  dkim,
  silent: true
});

const from = 'no-reply@' + sitename;

// {   // binary buffer as an attachment
//   filename: 'text2.txt',
//   content: new Buffer('hello world!', 'utf-8')
// },

export function sendEmail(email, subject, html, attachments) {

  return new Promise((resolve, reject) => {

    _sendEmail(
      { from, to: email, subject, html, attachments },
      function (error, reply) {
        if (error) reject(error);
        else resolve(reply);
      }
    );

  });
}
