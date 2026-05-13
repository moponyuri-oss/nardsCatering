const express = require('express');
const router = express.Router();
const clientsController = require('../Controller/clientController');

router.get('/', clientsController.getAllClients);
router.post('/', clientsController.createClient);
router.get('/:id', clientsController.getClientById);
router.put('/:id', clientsController.updateClient);
router.delete('/:id', clientsController.deleteClient);

module.exports = router;
