import express from 'express';
import {
  getBuildingOverview,
  getAllUnits,
  updateUnitQuota,
  exportCSV
} from '../controllers/landlordController.js';

const router = express.Router();

router.get('/:building_id/overview', getBuildingOverview);
router.get('/:building_id/units', getAllUnits);
router.patch('/unit/:unit_id/quota', updateUnitQuota);
router.get('/:building_id/export', exportCSV);

export default router;

