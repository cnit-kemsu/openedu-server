const sendmail = reauire('sendmail');


const _sendEmail = sendmail({
  //dkim,
  //silent: true
});

export function sendEmail(email, subject, html, attachments) {

  return new Promise((resolve, reject) => {

    _sendEmail(
      { 'info-openedu@kemsu.ru', to: email, subject, html, attachments },
      function (error, reply) {
        if (error) reject(error);
        else resolve(reply);
      }
    );

  });
}

sendEmail('johncooper87@mail.ru', 'asd', '<div>123</div>');