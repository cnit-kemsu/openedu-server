import sendmail from 'sendmail';
import { emailConfig } from '../../config';

const { from, dkim } = emailConfig;

const _sendEmail = sendmail({
  dkim,
  silent: true
});

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

// const fs = require('fs');
// const sendFile = fs.readFileSync('send.jpg');
// sendEmail('sibkrot@mail.ru', 'test subject', '<div>test body</div>');