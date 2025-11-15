import express from 'express';
import {
  getTenantSummary,
  getTenantUsage,
  acknowledgeTip
} from '../controllers/tenantController.js';

const router = express.Router();

router.get('/:id/summary', getTenantSummary);
router.get('/:id/usage', getTenantUsage);
router.post('/:id/acknowledge', acknowledgeTip);

export default router;

