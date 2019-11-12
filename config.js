const dotenv = require('dotenv');
dotenv.config();

let {
  BACKENDSERVER,
  FRONTENDSERVER,
  PGUSER,
  PGPASSWORD,
  SECRET,
  SESUSER,
  SESPASSWORD
} = process.env

let NUM_ROUNDS = 12;
let SECRET_KEY = SECRET;

TRANSPORTER = {
  host: 'email-smtp.us-west-2.amazonaws.com',
  port: 465,
  secure: true,
  auth: {
    user: SESUSER,
    pass: SESPASSWORD
  }
}

if (process.env.NODE_ENV === "test") {
  DB_URI = `randomizer-test`
} else {
  DB_URI = process.env.DATABASE_URL || `randomizer`;
}

module.exports = { DB_URI, NUM_ROUNDS, SECRET_KEY, TRANSPORTER, PGUSER, PGPASSWORD, BACKENDSERVER, FRONTENDSERVER }