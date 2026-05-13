const pool = require('../Model/db');

exports.getAllClients = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Clients ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, contact, email } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Invalid client name' });
    }
    if (!contact || !/^\+63 \d{3} \d{3} \d{4}$/.test(contact)) {
      return res.status(400).json({ error: 'Invalid contact number' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const [result] = await pool.query(
      "INSERT INTO Clients (name, contact, email) VALUES (?, ?, ?)",
      [name, contact, email]
    );
    res.status(201).json({ message: 'Client created', clientId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Clients WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, contact, email } = req.body;
    const [result] = await pool.query(
      "UPDATE Clients SET name=?, contact=?, email=? WHERE id=?",
      [name, contact, email, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM Clients WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
