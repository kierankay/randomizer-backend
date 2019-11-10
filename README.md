# Randomizer

Randomizer creates randomized pairs of students from a group. This maximizes students' opportunity to learn from a diverse set of partners. 

To use it, you create a cohort or class, add students to it, set the minimum amount of pairs ago (n) that any pair from the next generated set of pairs could have happened, and generate a group. The algorithm randomly generates a new group of pairs ensuring that no pair happened at least n pairs ago. With an n of zero, pairing is completely random. With n equal to the number of students in the class, pairing will happen round-robin style.

Pairs can be saved with a project name and are automatically timestamped for future reference.

This repo is for the backend server. For the frontend, see [randomizer-frontend](https://github.com/kierankay/randomizer-frontend)

## Frameworks / Libraries

1. Javascript
  1. Node.js
    1. Express
    1. pg
    1. Passport
      1. Passport-jwt
      1. Passport-local
    1. Axios
    1. Bcrypt
    1. Body-parser
    1. Dotenv
1. Postgres

## Features

1. Authentication via bcrypt
1. Cohort creation
1. Student addition to cohorts
1. Project group creation

## Installation

```npm install```

## Usage

```TBD```
