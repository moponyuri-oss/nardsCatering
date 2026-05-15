const pool = require('../Model/db');

exports.getAllBookings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Bookings ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { clientName, address, eventType, package: eventPackage, eventDate, phone, email, guests, notes } = req.body;
    if (!clientName || !address || !eventType || !eventPackage || !eventDate || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const [result] = await pool.query(
      `INSERT INTO Bookings (clientName, address, eventType, package, eventDate, phone, email, guests, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientName, address, eventType, eventPackage, eventDate, phone, email || null, guests || 0, "pending", notes || null]
    );
    res.status(201).json({ message: "Booking created", bookingId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Bookings WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Booking not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use: pending, confirmed, completed, or cancelled" });
    }

    await conn.beginTransaction();

    const [bookingRows] = await conn.query(
      "SELECT id, package, status, guests FROM Bookings WHERE id = ? FOR UPDATE",
      [req.params.id]
    );
    if (!bookingRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = bookingRows[0];
    const isTransitionToConfirmed = status === 'confirmed' && booking.status !== 'confirmed';

    if (isTransitionToConfirmed) {
      const [pkgRows] = await conn.query(
        'SELECT id FROM Packages WHERE name = ? ORDER BY id DESC LIMIT 1',
        [booking.package]
      );

      if (pkgRows.length) {
        const pkg = pkgRows[0];

        const [requiredRows] = await conn.query(
          `SELECT di.inventory_id, i.name, i.quantity AS current_stock, CAST(SUM(di.qty_required) AS SIGNED) AS required_qty
           FROM (
             SELECT DISTINCT dish_id
             FROM PackageDishes
             WHERE package_id = ?
           ) pd
           JOIN DishIngredients di ON di.dish_id = pd.dish_id
           JOIN Inventory i ON i.id = di.inventory_id
           GROUP BY di.inventory_id, i.name, i.quantity`,
          [pkg.id]
        );

        if (requiredRows.length) {
          const insufficient = requiredRows.filter((r) => Number(r.current_stock) < Math.trunc(Number(r.required_qty)));
          if (insufficient.length) {
            await conn.rollback();
            return res.status(400).json({
              error: 'Insufficient ingredient stock for confirmation',
              details: insufficient.map((i) => ({
                ingredient: i.name,
                required: Math.trunc(Number(i.required_qty)),
                available: Math.trunc(Number(i.current_stock))
              }))
            });
          }

          for (const reqRow of requiredRows) {
            const requiredQty = Math.trunc(Number(reqRow.required_qty));
            await conn.query(
              'UPDATE Inventory SET quantity = quantity - ? WHERE id = ?',
              [requiredQty, reqRow.inventory_id]
            );
          }
        }
      }
    }

    await conn.query(
      "UPDATE Bookings SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    await conn.commit();
    res.json({
      message: "Booking status updated",
      inventoryDeducted: isTransitionToConfirmed
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { clientName, address, eventType, package: eventPackage, eventDate, phone, email, guests, notes } = req.body;
    if (!clientName || !address || !eventType || !eventPackage || !eventDate || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const [result] = await pool.query(
      `UPDATE Bookings SET clientName=?, address=?, eventType=?, package=?, eventDate=?, phone=?, email=?, guests=?, notes=? WHERE id=?`,
      [clientName, address, eventType, eventPackage, eventDate, phone, email || null, guests || 0, notes || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventTypes = async (req, res) => {
  const fallback = ['Wedding', 'Birthday Party', 'Christening', 'Debut', 'Baptismal', 'Party', 'Anniversary', 'House Blessing', 'Corporate Event', 'Other'];
  try {
    const [rows] = await pool.query("SELECT DISTINCT eventType FROM Bookings WHERE eventType IS NOT NULL AND eventType != '' ORDER BY eventType ASC");
    const fromDb = rows.map(r => r.eventType);
    // Merge: DB values first (preserves casing), then fallback entries not already present
    const merged = [...fromDb, ...fallback.filter(f => !fromDb.some(d => d.toLowerCase() === f.toLowerCase()))];
    res.json(merged);
  } catch (err) {
    res.json(fallback);
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM Bookings WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns confirmed bookings scheduled for today
exports.getTodayEvents = async (req, res) => {
  try {
    const n = new Date();
    const today = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    const [rows] = await pool.query(
      "SELECT * FROM Bookings WHERE status = 'confirmed' AND DATE(eventDate) = ? ORDER BY eventDate ASC",
      [today]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns confirmed bookings from tomorrow up to the next 30 days
exports.getUpcomingEvents = async (req, res) => {
  try {
    const n = new Date();
    const today = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    const f = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 30);
    const limit = f.getFullYear() + '-' + String(f.getMonth()+1).padStart(2,'0') + '-' + String(f.getDate()).padStart(2,'0');
    const [rows] = await pool.query(
      "SELECT * FROM Bookings WHERE status = 'confirmed' AND DATE(eventDate) > ? AND DATE(eventDate) <= ? ORDER BY eventDate ASC LIMIT 15",
      [today, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Returns count of bookings grouped by status for the dashboard summary
exports.getStatusSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM Bookings GROUP BY status"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
