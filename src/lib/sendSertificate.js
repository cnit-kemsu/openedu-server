import path from 'path';
import { sitename } from '../config';
import { sendEmail } from './sendEmail';
import { toWrittenCrun } from './toWrittenCrun';
import { createPdf } from './createPdf';
import { getUserProgress } from './getUserProgress';

function createSertificateContent(course, user, { sertificateNumber, deliveryDate }) {

  const labourInput_creditUnit = course?.data?.labourInput_creditUnit;
  const _user = user?.data || {};

  return `
    <html>
      <head>
      <style>
        body {
          margin: 0px;
          color: rgb(47, 47, 47);
          font-family: 'calibri';
          font-weight: 500;
        }
        #page1 {
          background-image: url('sertificate-page-1.jpg');
          background-size: 100% 100%;
          width: 100%;
          height: 100%;
        }
        #page2 {
          background-image: url('sertificate-page-2.jpg');
          background-size: 100% 100%;
          width: 100%;
          height: 100%;
        }
        #fullname {
          position: absolute;
          top: 20.5%;
          height: 4%;
          left: 40%;
          width: 55%;
          padding: 20px;
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          text-transform: uppercase;
        }
        #name_and_credit_units {
          position: absolute;
          top: 27%;
          left: 40%;
          width: 55%;
        }
        #name {
          width: 100%;
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          text-transform: uppercase;
        }
        #credit_units {
          margin-top: 10px;
          width: 100%;
          text-align: center;
          font-size: 36px;
        }
        #date {
          position: absolute;
          bottom: 52.2%;
          left: 9%;
          font-size: 28px;
        }
        #sertificate_number {
          position: absolute;
          bottom: 61.8%;
          left: 73.3%;
          font-size: 36px;
        }
      </style>
      <body>

        <div id="page1">
          <div id="fullname">${_user.lastname} ${_user.firstname} ${_user.middlename}</div>
          <div id="name_and_credit_units">
            <div id="name">${course.name}</div>
            ${labourInput_creditUnit ? `<div id="credit_units">(${labourInput_creditUnit} ${toWrittenCrun(labourInput_creditUnit)})</div>` : ''}
          </div>
          <div id="date">${deliveryDate}</div>
          <div id="sertificate_number">${sertificateNumber}</div>
        </div>
        <div id="page2">Сертификат 2</div>

      </body>
    </html>
  `;
}

const base = path.resolve(__dirname) |> #.replace(/\\/g, '/') |> 'file:///' + #;

export async function sendSertificate(db, userId, courseId) {

  const { certificateAvailable } = await getUserProgress(db, courseId, userId);
  if (!certificateAvailable) throw new Error('Sertificate not awailable');

  try {
    const [course] = await db.query('SELECT _name name, _data data FROM course_delivery_instances WHERE id = ?', [courseId]);
    const [user] = await db.query('SELECT email, _data data FROM users WHERE id = ?', [userId]);
    const [free_enrollment] = await db.query('SELECT _data data FROM free_course_enrollments WHERE course_id = ? AND user_id', [courseId, userId]);
    const [paid_purchase] = await db.query('SELECT _data data FROM paid_course_purchases WHERE course_id = ? AND user_id', [courseId, userId]);
    let info = paid_purchase?.data || free_enrollment?.data;
    if (!info) {
      info = {
        sertificateNumber: new Date().valueOf().toString(),
        deliveryDate: new Date().toISOString().slice(0, 10).split('-').reverse().join('.')
      };
      if (free_enrollment) await db.query('UPDATE free_course_enrollments SET _data = ? WHERE course_id = ? AND user_id', [JSON.stringify(info), courseId, userId]);
      if (paid_purchase) await db.query('UPDATE paid_course_purchases SET _data = ? WHERE course_id = ? AND user_id', [JSON.stringify(info), courseId, userId]);
    } else info = JSON.parse(info);
    course.data = JSON.parse(course.data);
    user.data = JSON.parse(user.data);
    
    const emailSubject = `Сертификат об онлайн-обучении на сайте ${sitename}`;
    const emailHTML = `
      <div>Вы успешно прошли обучение.</div>
    `;
    const receiptFile = {
      filename: 'Сертификат.pdf',
      content: createSertificateContent(course, user, info) |> await createPdf(#, { format: 'A4', orientation: 'landscape', base })
    };
    sendEmail(user.email, emailSubject, emailHTML, [receiptFile]);

  } catch(error) {
    throw error;
  }
  
}