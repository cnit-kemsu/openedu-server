const fs = require('fs');
const path = require('path');

export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'specify password!!!',
  database: 'openedu',
  port: 3306
};

export const jwtSecret = 'DirtyLitt1e$ecret';

export const superUser = {
  password: 'specify password!!!',
  email: 'specify email'
};

export const url = 'http://specify full domain name!!!:3000';
export const sitename = 'specify full domain name!!!';
export const devUrl = 'http://specify full domain name!!!:443';

const privateKey = fs.readFileSync(path.resolve(__dirname, 'dkim-private.pem'));

export const emailConfig = {
  //from: 'no-reply@' + sitename,
  from: 'no-reply@specify full domain name!!!',
  dkim: {
    domainName: 'specify domain name!!!',
    privateKey,
    keySelector: 'specify key selector!!!'
  }
};

export const zoom = '1.5';

export const payment = {
  token: 'specify token!!!',
  secret: 'specify secret!!!'
};