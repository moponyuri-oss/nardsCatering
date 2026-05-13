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
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use: pending, confirmed, completed, or cancelled" });
    }
    const [result] = await pool.query(
      "UPDATE Bookings SET status = ? WHERE id = ?",
      [status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
