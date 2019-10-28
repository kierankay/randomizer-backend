const { Client } = require('pg');
const { DB_URI } = require('./config');
const dotenv = require('dotenv');
dotenv.config();

const db = new Client({ database: DB_URI, user: process.env.PGUSER, password: process.env.PGPASSWORD });

db.connect();

module.exports = db;