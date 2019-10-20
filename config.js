let DB_URI = `postgresql://`;
let NUM_ROUNDS = 12;
let SECRET_KEY = 'somethingSecret'

if (process.env.NODE_ENV === "test") {
  DB_URI = `${DB_URI}/randomizer-test`
} else {
  DB_URI = process.env.DATABASE_URL || `${DB_URI}/randomizer`;
}

module.exports =  {DB_URI, NUM_ROUNDS, SECRET_KEY}