import path from 'path';
import { sitename } from '../config';
import { sendEmail } from './sendEmail';
import { toWrittenCrun } from './toWrittenCrun';
import { createPdf } from './createPdf';
import { getUserProgress } from './getUserProgress';

const letterGrade = `
  <table class="gradetable">

    <tr>
      <td>
        Баллы
      </td>
      <td>
        Оценка
      </td>
    </tr>

    <tr>
      <td>
        85-100
      </td>
      <td>
        Отлично
      </td>
    </tr>

    <tr>
      <td>
        71-84
      </td>
      <td>
        Хорошо
      </td>
    </tr>

    <tr>
      <td>
        56-70
      </td>
      <td>
        Удовлетворительно
      </td>
    </tr>

    <tr>
      <td>
        0-55
      </td>
      <td>
        Неудовлетворительно
      </td>
    </tr>

  </table>
`;

const pass_failGrade = `
  <table class="gradetable">

    <tr>
      <td>
        Баллы
      </td>
      <td>
        Результат
      </td>
    </tr>

    <tr>
      <td>
        60-100
      </td>
      <td>
        Зачет
      </td>
    </tr>

    <tr>
      <td>
        0-59
      </td>
      <td>
        Незачет
      </td>
    </tr>

  </table>
`;

function createSertificateContent(course, user, { sertificateNumber, deliveryDate, startDate, totalScore, maxScore }) {

  const labourInput_creditUnit = course?.data?.labourInput_creditUnit;
  const laborInput_hours = course?.data?.laborInput_hours;
  const outcomes = course?.data?.outcomes;
  const competencies = course?.data?.competencies;
  const _user = user?.data || {};
  const creditUnits = labourInput_creditUnit.toString() + ' ' + toWrittenCrun(labourInput_creditUnit);
  const gradeType = course?.data?.gradeType;

  let grade, gradeSystem;
  const percentage = totalScore / maxScore * 100;
  if (gradeType === 'LETTER') {
    gradeSystem = letterGrade;
    grade = 'Отлично';
    if (percentage < 85) grade = 'Хорошо';
    if (percentage < 71) grade = 'Удовлетворительно';
    if (percentage < 56) grade = 'Нудовлетворительно';
  }
  if (gradeType === 'PASS/FAIL') {
    gradeSystem = pass_failGrade;
    grade = 'Зачет';
    if (percentage < 60) grade = 'Незачет';
  }

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
        #maintable {
          width: 100%;
          padding-top: 150px;
          padding-bottom: 50px;
          padding-left: 100px;
          padding-right: 100px;
          width: 100%;
          border-spacing: 0px;
        }
        #tdtable1 {
          width: 50%;
          border: 1px solid black;
          padding: 0px;
          vertical-align: top;
        }
        #tdtable2 {
          width: 50%;
          border: 1px solid black;
          border-left: 0px;
          padding: 0px;
          vertical-align: top;
        }
        #table1 {
          width: 100%;
          border-spacing: 0px;
        }
        #table2 {
          width: 100%;
          border-spacing: 0px;
        }
        #table1 td, #table2 td {
          border-bottom: 1px solid black;
          font-size: 28px;
          padding: 20px;
        }
        .tdlast {
          border-bottom: 0px !important;
        }
        .tdheader {
          font-size: 32px;
          text-align: center;
          width: 100%;
        }
        .gradetable {
          border: 1px solid black;
          border-right: 0px;
          border-bottom: 0px;
          border-spacing: 0px;
        }
        .gradetable td {
          font-size: 24px !important;;
          border-bottom: 1px solid black;
          border-right: 1px solid black;
          padding: 5px !important;
        }
      </style>
      <body>

        <div id="page1">
          <div id="fullname">${_user.lastname} ${_user.firstname} ${_user.middlename}</div>
          <div id="name_and_credit_units">
            <div id="name">${course.name}</div>
            ${labourInput_creditUnit ? `<div id="credit_units">трудоемкостью ${creditUnits},` : ''}
            ${grade ? `получив ${gradeType === 'LETTER' ? 'оценку ' : ''}"${grade}",` : ''}
            набрав ${percentage} баллов из 100 </div>
          </div>
          <div id="date">${deliveryDate}</div>
          <div id="sertificate_number">${sertificateNumber}</div>
        </div>
        <div id="page2">
          <table id="maintable">
            <tbody>
              <tr>
                <td id="tdtable1">
                  <table id="table1">
                    <tbody>
                      <tr>
                        <td>
                          ${_user.lastname} ${_user.firstname} ${_user.middlename}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Название курса: ${course.name}
                          <br />
                          Период освоения курса: ${startDate} - ${deliveryDate}
                          <br />
                          Трудоемкость: ${creditUnits} (часов: ${laborInput_hours})
                        </td>
                      </tr>
                        <td>
                          Номер сертификата: ${sertificateNumber}
                          <br />
                          Дата выдачи: ${deliveryDate}
                        </td>
                      </tr>
                      <tr>
                        <td class="tdlast">
                          Количество баллов: ${totalScore} из ${maxScore}
                          ${gradeType !== 'SCORE' ? `<div>
                              Оценка: ${grade}
                            </div>
                            <div>
                              <div>
                                Критерии оценивания:
                              </div>
                              <div>
                                ${gradeSystem}
                              </div>
                            </div>` : ''}
                        </td>
                      </tr>
                      
                    </tbody>
                  </table>
                </td>
                <td id="tdtable2">
                  <table id="table2">
                    <tbody>
                      ${outcomes ? `<tr>
                        <td>
                          <div class="tdheader">Результат обучения:</div>
                          <div>${outcomes}</div>
                        </td>
                      </tr>` : ''}
                      ${competencies ? `<tr>
                        <td class="tdlast">
                          <div class="tdheader">Направленные на формирование компетенций:</div>
                          <div>${competencies}</div>
                        </td>
                      </tr>` : ''}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </body>
    </html>
  `;
}

const base = path.resolve(__dirname) |> #.replace(/\\/g, '/') |> 'file:///' + #;

export async function sendSertificate(db, userId, courseId) {

  const { certificateAvailable, units } = await getUserProgress(db, courseId, userId);
  if (!certificateAvailable) throw new Error('Sertificate not awailable');

  let maxScore = 0, totalScore = 0;
  for (const { score, quiz } of units) {
    if (!quiz.finalCertification) continue;
    maxScore += quiz.maxScore;
    totalScore += score;
  }

  try {
    const [course] = await db.query('SELECT _name name, _data data FROM course_delivery_instances WHERE id = ?', [courseId]);
    const [user] = await db.query('SELECT email, _data data FROM users WHERE id = ?', [userId]);
    const [free_enrollment] = await db.query('SELECT _data data, enrollment_date startDate FROM free_course_enrollments WHERE course_id = ? AND user_id', [courseId, userId]);
    const [paid_purchase] = await db.query('SELECT _data data, purchase_date startDate FROM paid_course_purchases WHERE course_id = ? AND user_id', [courseId, userId]);
    let info = paid_purchase?.data || free_enrollment?.data;
    if (!info) {
      info = {
        sertificateNumber: new Date().valueOf().toString(),
        deliveryDate: new Date().toISOString().slice(0, 10).split('-').reverse().join('.')
      };
      if (free_enrollment) await db.query('UPDATE free_course_enrollments SET _data = ? WHERE course_id = ? AND user_id', [JSON.stringify(info), courseId, userId]);
      if (paid_purchase) await db.query('UPDATE paid_course_purchases SET _data = ? WHERE course_id = ? AND user_id', [JSON.stringify(info), courseId, userId]);
    } else info = JSON.parse(info);
    info.startDate = paid_purchase?.startDate || free_enrollment?.startDate;
    info.startDate = new Date(info.startDate).toISOString().slice(0, 10).split('-').reverse().join('.');
    course.data = JSON.parse(course.data);
    user.data = JSON.parse(user.data);

    info.maxScore = maxScore;
    info.totalScore = totalScore;
    
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