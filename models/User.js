const db = require('../db');
const bcrypt = require('bcrypt');
const { NUM_ROUNDS, SECRET_KEY } = require('../config')
const jwt = require('jsonwebtoken');

class User {
  constructor(firstName, lastName, email, username) {
    this.username = username
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
  }

  static async createUser(username, email, password) {
    let hashedPassword = await bcrypt.hash(password, NUM_ROUNDS)
    let result = await db.query(`
    INSERT INTO users
    (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING username, email, password
    `, [username, email, hashedPassword])
    return result.rows[0]
  }

  static async loginUser(username, password) {
    let result = await db.query(`
    SELECT password
    FROM users
    WHERE username = $1`,
      [username]);
    let comparison = await bcrypt.compare(password, result.rows[0].password);
    let token = comparison ? await jwt.sign(username, SECRET_KEY) : null;
    return token;
  }

  static async verifyJwt(req, res, next) {
    try {
      let result = req.body.token ? jwt.verify(req.body.token, SECRET_KEY) : jwt.verify(req.query.token, SECRET_KEY);
      if (result) {
        req.user = result;
        return next()
      }
    } catch (err) {
      return next(err)
    }
  }

  static async getUserFromUsername(username) {
    let result = await db.query(`
    SELECT *
    FROM users
    WHERE username = $1
    `, [username])
    if (result.rows.length === 1) {
      return result.rows[0]
    } else {
      return ('no user by that name')
    }
  }

  static async getUserFromEmail(email) {
    let result = await db.query(`
    SELECT *
    FROM users
    WHERE email = $1
    `, [email])
    if (result.rows.length === 1) {
      return result.rows[0]
    } else {
      return ('no user with that email')
    }
  }
}

module.exports = User;