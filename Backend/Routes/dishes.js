const express    = require('express');
const router     = express.Router();
const dishesCtrl = require('../Controller/dishesController');

router.get('/',       dishesCtrl.getAllDishes);
router.post('/',      dishesCtrl.createDish);
router.get('/:id/ingredients', dishesCtrl.getDishIngredients);
router.put('/:id/ingredients', dishesCtrl.replaceDishIngredients);
router.put('/:id',    dishesCtrl.updateDish);
router.delete('/:id', dishesCtrl.deleteDish);

module.exports = router;
