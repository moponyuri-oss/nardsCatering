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

exports.getDishIngredients = async (req, res) => {
  try {
    const [dishRows] = await pool.query('SELECT id, name, category FROM Dishes WHERE id=?', [req.params.id]);
    if (!dishRows.length) return res.status(404).json({ error: 'Dish not found' });

    const [rows] = await pool.query(
      `SELECT di.id, di.inventory_id, di.qty_required, i.name AS inventory_name, i.quantity AS current_stock
       FROM DishIngredients di
       JOIN Inventory i ON i.id = di.inventory_id
       WHERE di.dish_id = ?
       ORDER BY i.name ASC`,
      [req.params.id]
    );

    res.json({
      dish: dishRows[0],
      ingredients: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.replaceDishIngredients = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { ingredients } = req.body;
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'ingredients must be an array' });
    }

    const [dishRows] = await conn.query('SELECT id FROM Dishes WHERE id=?', [req.params.id]);
    if (!dishRows.length) return res.status(404).json({ error: 'Dish not found' });

    const normalized = ingredients
      .map((item) => ({
        inventory_id: Number(item.inventory_id),
        qty_required: Number(item.qty_required)
      }))
      .filter((item) => Number.isInteger(item.inventory_id) && Number.isInteger(item.qty_required) && item.qty_required > 0);

    // De-duplicate by inventory_id (keep latest value) so accidental duplicate rows
    // in the UI do not inflate required ingredient counts.
    const mergedMap = new Map();
    for (const item of normalized) {
      mergedMap.set(item.inventory_id, item.qty_required);
    }
    const merged = Array.from(mergedMap.entries()).map(([inventory_id, qty_required]) => ({
      inventory_id,
      qty_required
    }));

    if (merged.length) {
      const placeholders = merged.map(() => '?').join(',');
      const [existing] = await conn.query(
        `SELECT id FROM Inventory WHERE id IN (${placeholders})`,
        merged.map((i) => i.inventory_id)
      );
      if (existing.length !== merged.length) {
        return res.status(400).json({ error: 'One or more ingredients do not exist in inventory' });
      }
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM DishIngredients WHERE dish_id=?', [req.params.id]);

    for (const item of merged) {
      await conn.query(
        'INSERT INTO DishIngredients (dish_id, inventory_id, qty_required) VALUES (?, ?, ?)',
        [req.params.id, item.inventory_id, item.qty_required]
      );
    }

    await conn.commit();
    res.json({ message: 'Dish ingredients updated', count: merged.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
