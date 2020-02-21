const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');
const {
  FRONTENDSERVER, NUM_ROUNDS, SECRET_KEY, TRANSPORTER,
} = require('../config');

const transporter = nodemailer.createTransport(TRANSPORTER);
// const moment = require('moment');

class User {
  constructor(firstName, lastName, email, username) {
    this.username = username;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  static async createUser(firstName, lastName, organization, email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, NUM_ROUNDS);
      const result = await db.query(`
      WITH org_id AS (
        INSERT INTO organizations (name) 
        VALUES ($3) 
        RETURNING id
        )
    INSERT INTO users (first_name, last_name, organization_id, email, password)
    VALUES ($1, $2, (SELECT id FROM org_id), $4, $5)
    RETURNING first_name, last_name, organization_id, email, password;
    `, [firstName, lastName, organization, email, hashedPassword]);
      return result.rows[0];
    } catch (err) {
      return err;
    }
  }

  static async loginUser(email, password) {
    try {
      const result = await db.query(`
      SELECT password, organization_id
      FROM users
      WHERE email = $1`, [email]);
      const storedPassword = result.rows[0].password;
      const orgId = result.rows[0].organization_id;
      const comparison = await bcrypt.compare(password, storedPassword);
      const token = comparison
        ? await jwt.sign({ email, organization_id: orgId }, SECRET_KEY) : false;
      return token;
    } catch (err) {
      return { message: 'invalid email or password' };
    }
  }

  static async verifyJwt(req, res, next) {
    // Get the JWT from the body or query string
    const token = req.body.token || req.query.token;
    try {
      // attempt to decode the token
      const result = jwt.verify(token, SECRET_KEY);

      // if the token is valid, serialize the user email and their org ID to the request
      if (result) {
        req.user = {
          email: result.email,
          organization: result.organization_id,
        };
        return next();
      }
      throw new Error('Invalid user details');
    } catch (err) {
      return next(err);
    }
  }

  static async checkUserByEmail(email) {
    const result = await db.query(`
    SELECT *
    FROM users
    WHERE email = $1
    `, [email]);
    if (result.rows.length === 1) {
      return result.rows[0];
    }
    return ('no user by that email');
  }

  static async createPasswordResetToken(user) {
    try {
      const { id } = user;
      const token = jwt.sign({ user_id: id }, SECRET_KEY);
      await db.query(`
        INSERT INTO password_tokens (user_id, hashed_token)
        VALUES ($1, $2)
        RETURNING id, user_id, hashed_token, date
      `, [id, token]);
      return token;
    } catch (err) {
      throw new Error(err.detail);
    }
  }

  static async verifyPasswordResetToken(token) {
    try {
      const decodedToken = jwt.verify(token, SECRET_KEY);
      const tokenData = await db.query(`
      SELECT valid 
      FROM password_tokens
      WHERE hashed_token=$1
    `, [token]);
      const currTime = new Date().getTime() / 1000;
      const hoursDiff = (currTime - decodedToken.iat) / 3600;
      const tokenValid = (hoursDiff < 1 && tokenData.rows[0].valid);
      return tokenValid;
    } catch (err) {
      throw new Error(err.detail);
    }
  }

  static async changePasswordWithToken(token, password) {
    try {
      const expiredToken = await db.query(`
      UPDATE password_tokens 
      SET valid = FALSE
      WHERE hashed_token=$1
      RETURNING id, user_id, hashed_token, valid
    `, [token]);
      const { user_id } = expiredToken.rows[0];
      const hashedPassword = await bcrypt.hash(password, NUM_ROUNDS);
      const userData = await db.query(`
    UPDATE users 
      SET password = $1
      WHERE id=$2
      RETURNING id, first_name, last_name, organization_id, email, password
    `, [hashedPassword, user_id]);
      return { expiredToken, userData };
    } catch (err) {
      throw new Error(err.detail);
    }
  }

  static async sendPasswordResetEmail(token, email) {
    try {
      const info = await transporter.sendMail({
        from: '"Kieran Kay" <kierankay@gmail.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `Click <a href="${FRONTENDSERVER}/reset-password/${token}">here</a> to reset your password. \
      If you do not recognize this request, please ignore it.`
      });
      return info;
    } catch (err) {
      throw new Error(err.detail);
    }
  }
}

module.exports = User;
