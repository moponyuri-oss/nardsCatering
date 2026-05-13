const pool = require('../Model/db');

// GET all packages with their assets, dishes, and freebies
exports.getAllPackages = async (req, res) => {
  try {
    const [packages] = await pool.query('SELECT * FROM Packages ORDER BY id ASC');
    for (const pkg of packages) {
      const [assets] = await pool.query(
        `SELECT pa.qty_required, ca.id AS asset_id, ca.name, ca.unit
         FROM PackageAssets pa
         JOIN CateringAssets ca ON ca.id = pa.asset_id
         WHERE pa.package_id = ?`,
        [pkg.id]
      );
      pkg.assets = assets;
      const [dishes] = await pool.query(
        `SELECT pd.dish_id, d.name, d.category
         FROM PackageDishes pd
         JOIN Dishes d ON d.id = pd.dish_id
         WHERE pd.package_id = ?`,
        [pkg.id]
      );
      pkg.dishes = dishes;
      const [freebies] = await pool.query(
        'SELECT id, name FROM PackageFreebies WHERE package_id = ? ORDER BY id ASC',
        [pkg.id]
      );
      pkg.freebies = freebies;
    }
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single package with assets, dishes, and freebies
exports.getPackageById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Packages WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Package not found' });
    const pkg = rows[0];
    const [assets] = await pool.query(
      `SELECT pa.qty_required, ca.id AS asset_id, ca.name, ca.unit
       FROM PackageAssets pa
       JOIN CateringAssets ca ON ca.id = pa.asset_id
       WHERE pa.package_id = ?`,
      [pkg.id]
    );
    pkg.assets = assets;
    const [dishes] = await pool.query(
      `SELECT pd.dish_id, d.name, d.category
       FROM PackageDishes pd
       JOIN Dishes d ON d.id = pd.dish_id
       WHERE pd.package_id = ?`,
      [pkg.id]
    );
    pkg.dishes = dishes;
    const [freebies] = await pool.query(
      'SELECT id, name FROM PackageFreebies WHERE package_id = ? ORDER BY id ASC',
      [pkg.id]
    );
    pkg.freebies = freebies;
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create package (with assets array)
exports.createPackage = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, price, min_guests, assets, dishes, freebies } = req.body;
    if (!name || price == null) {
      await conn.rollback();
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const [result] = await conn.query(
      'INSERT INTO Packages (name, price, min_guests) VALUES (?, ?, ?)',
      [name, price, min_guests || 0]
    );
    const packageId = result.insertId;
    if (Array.isArray(assets) && assets.length) {
      for (const a of assets) {
        await conn.query(
          'INSERT INTO PackageAssets (package_id, asset_id, qty_required) VALUES (?, ?, ?)',
          [packageId, a.asset_id, a.qty_required || 1]
        );
      }
    }
    if (Array.isArray(dishes) && dishes.length) {
      for (const d of dishes) {
        await conn.query(
          'INSERT INTO PackageDishes (package_id, dish_id) VALUES (?, ?)',
          [packageId, d.dish_id]
        );
      }
    }
    if (Array.isArray(freebies) && freebies.length) {
      for (const f of freebies) {
        await conn.query(
          'INSERT INTO PackageFreebies (package_id, name) VALUES (?, ?)',
          [packageId, f.name]
        );
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Package created', packageId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// PUT update package (replaces all assets)
exports.updatePackage = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, price, min_guests, assets, dishes, freebies } = req.body;
    if (!name || price == null) {
      await conn.rollback();
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const [result] = await conn.query(
      'UPDATE Packages SET name=?, price=?, min_guests=? WHERE id=?',
      [name, price, min_guests || 0, req.params.id]
    );
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ error: 'Package not found' });
    }
    await conn.query('DELETE FROM PackageAssets WHERE package_id=?', [req.params.id]);
    if (Array.isArray(assets) && assets.length) {
      for (const a of assets) {
        await conn.query(
          'INSERT INTO PackageAssets (package_id, asset_id, qty_required) VALUES (?, ?, ?)',
          [req.params.id, a.asset_id, a.qty_required || 1]
        );
      }
    }
    await conn.query('DELETE FROM PackageDishes WHERE package_id=?', [req.params.id]);
    if (Array.isArray(dishes) && dishes.length) {
      for (const d of dishes) {
        await conn.query(
          'INSERT INTO PackageDishes (package_id, dish_id) VALUES (?, ?)',
          [req.params.id, d.dish_id]
        );
      }
    }
    await conn.query('DELETE FROM PackageFreebies WHERE package_id=?', [req.params.id]);
    if (Array.isArray(freebies) && freebies.length) {
      for (const f of freebies) {
        await conn.query(
          'INSERT INTO PackageFreebies (package_id, name) VALUES (?, ?)',
          [req.params.id, f.name]
        );
      }
    }
    await conn.commit();
    res.json({ message: 'Package updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// DELETE package (PackageAssets cascade-deleted via FK)
exports.deletePackage = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Packages WHERE id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
