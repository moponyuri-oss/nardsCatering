const express = require('express');
const router = express.Router();
const bookingsController = require('../Controller/bookingsController');

router.get('/eventtypes', bookingsController.getEventTypes);
router.get('/today',      bookingsController.getTodayEvents);
router.get('/upcoming',   bookingsController.getUpcomingEvents);
router.get('/summary',    bookingsController.getStatusSummary);
router.get('/', bookingsController.getAllBookings);
router.post('/', bookingsController.createBooking);
router.get('/:id', bookingsController.getBookingById);
router.patch('/:id/status', bookingsController.updateBookingStatus);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

module.exports = router;
