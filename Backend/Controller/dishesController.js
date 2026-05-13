const pool = require('../Model/db');

exports.getAllDishes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Dishes ORDER BY category ASC, name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDish = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [result] = await pool.query(
      'INSERT INTO Dishes (name, category) VALUES (?, ?)',
      [name, category || 'Main Course']
    );
    res.status(201).json({ message: 'Dish created', dishId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDish = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [result] = await pool.query(
      'UPDATE Dishes SET name=?, category=? WHERE id=?',
      [name, category || 'Main Course', req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Dish not found' });
    res.json({ message: 'Dish updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDish = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Dishes WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Dish not found' });
    res.json({ message: 'Dish deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
