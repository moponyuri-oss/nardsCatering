const express = require('express');
const router  = express.Router();
const pkgCtrl = require('../Controller/packagesController');

router.get('/',    pkgCtrl.getAllPackages);
router.post('/',   pkgCtrl.createPackage);
router.get('/:id', pkgCtrl.getPackageById);
router.put('/:id', pkgCtrl.updatePackage);
router.delete('/:id', pkgCtrl.deletePackage);

module.exports = router;
