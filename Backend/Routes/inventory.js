const express = require('express');
const router = express.Router();
const inventoryController = require('../Controller/inventoryController');

router.get('/', inventoryController.getAllInventory);
router.post('/', inventoryController.createInventory);
router.get('/:id', inventoryController.getInventoryById);
router.put('/:id', inventoryController.updateInventory);
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;
