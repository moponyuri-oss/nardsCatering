const express = require('express');
const router = express.Router();
const menuController = require('../Controller/menuController');

router.get('/', menuController.getAllMenu);
router.post('/', menuController.createMenu);
router.get('/:id', menuController.getMenuById);
router.put('/:id', menuController.updateMenu);
router.delete('/:id', menuController.deleteMenu);

module.exports = router;
