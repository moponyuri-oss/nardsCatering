const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  dateStrings: true   // return DATE/DATETIME as 'YYYY-MM-DD' strings, not JS Date objects
});

module.exports = pool;
