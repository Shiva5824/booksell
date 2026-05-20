import { Router } from "express";
import { 
  getStats, 
  getAllUsers, 
  toggleUserStatus, 
  toggleAdminRole,
  getAllProducts, 
  toggleProductStatus,
  deleteUserAccount,
  resetTraffic
} from "../controllers/admin.controller.js";
import { updateSiteContact } from "../controllers/site.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);
router.post("/traffic/reset", resetTraffic);
router.get("/users", getAllUsers);
router.post("/users/:id/toggle", toggleUserStatus);
router.post("/users/:id/role", toggleAdminRole);
router.delete("/users/:id", deleteUserAccount);
router.get("/products", getAllProducts);
router.post("/products/:id/toggle", toggleProductStatus);
router.put("/site/contact", updateSiteContact);

export default router;
