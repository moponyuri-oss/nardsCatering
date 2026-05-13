const express    = require('express');
const router     = express.Router();
const assetsCtrl = require('../Controller/assetsController');

router.get('/',    assetsCtrl.getAllAssets);
router.post('/',   assetsCtrl.createAsset);
router.put('/:id', assetsCtrl.updateAsset);
router.delete('/:id', assetsCtrl.deleteAsset);

module.exports = router;
