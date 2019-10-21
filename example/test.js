import crypto from 'crypto';

function getRightFormatNowDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .substring(0, 19)
    + (offset < 0 ? '+' : '-') + ('0' + Math.floor(Math.abs(offset) / 60)).slice(-2) + ':' + ('0' + offset % 60).slice(-2);
}

const token = '20:BA:B6:E9:8A:39:E9:48:93:3B:8D:41:DF:DD:60:0D';
const secret = 'FAABF3DCBB204643B22D4F8EC79DBC53';
const order_id = '4294967295_4294967295';
const request_date = getRightFormatNowDate();
console.log(request_date);
const amount = {
  value: '110.00',
  currency: 'RUB'
};

const data = `token=${token}order_id=${order_id}request_date=${request_date}amount.value=${amount.value}amount.currency=${amount.currency}`;

const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
console.log(signature);

const request = {
  token,
  order_id,
  request_date,
  amount,
  //additional_info: 'Payment for course',
  //description: 'Payment from someone',
  //callback_url: 'http://pay.kemsu.ru/libs/callback.php',
  //return_url: 'http://pay.kemsu.ru/',
  //merchant_name: 'Кемеровский государственный университет',
  signature
};

const _request = JSON.stringify(request) |> Buffer.from(#).toString('base64');
console.log(_request);

