require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
  res.redirect('/login');
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Login', 'Login.html'));
});


app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'Admin', 'Admin.html'));
});


app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'Customer', 'index.html'));
});




app.use('/bookings',  require('./Backend/Routes/bookings'));
app.use('/clients',   require('./Backend/Routes/client'));
app.use('/inventory', require('./Backend/Routes/inventory'));
app.use('/menu',      require('./Backend/Routes/menu'));
app.use('/packages',  require('./Backend/Routes/packages'));
app.use('/assets',    require('./Backend/Routes/assets'));
app.use('/dishes',    require('./Backend/Routes/dishes'));




app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});