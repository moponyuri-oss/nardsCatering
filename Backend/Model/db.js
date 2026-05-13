const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "nardcatering",
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  dateStrings: true   // return DATE/DATETIME as 'YYYY-MM-DD' strings, not JS Date objects
});

module.exports = pool;
