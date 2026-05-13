const pool = require('../Model/db');

exports.getAllAssets = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CateringAssets ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [result] = await pool.query(
      'INSERT INTO CateringAssets (name, quantity, unit) VALUES (?, ?, ?)',
      [name, quantity ?? 0, unit || 'pcs']
    );
    res.status(201).json({ message: 'Asset created', assetId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { name, quantity, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [result] = await pool.query(
      'UPDATE CateringAssets SET name=?, quantity=?, unit=? WHERE id=?',
      [name, quantity ?? 0, unit || 'pcs', req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM CateringAssets WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
