const pool = require('../Model/db');

exports.getAllInventory = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Inventory ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createInventory = async (req, res) => {
  try {
    const { name, quantity, threshold } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const qty = Number(quantity ?? 0);
    const th = Number(threshold ?? 0);
    if (!Number.isInteger(qty) || qty < 0 || !Number.isInteger(th) || th < 0) {
      return res.status(400).json({ error: 'Quantity and threshold must be whole numbers (0 or greater)' });
    }
    const [result] = await pool.query(
      "INSERT INTO Inventory (name, quantity, threshold) VALUES (?, ?, ?)",
      [name, qty, th]
    );
    res.status(201).json({ message: 'Inventory item created', inventoryId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Inventory WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { name, quantity, threshold } = req.body;
    const qty = Number(quantity);
    const th = Number(threshold);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!Number.isInteger(qty) || qty < 0 || !Number.isInteger(th) || th < 0) {
      return res.status(400).json({ error: 'Quantity and threshold must be whole numbers (0 or greater)' });
    }
    const [result] = await pool.query(
      "UPDATE Inventory SET name=?, quantity=?, threshold=? WHERE id=?",
      [name, qty, th, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM Inventory WHERE id=?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Inventory deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
