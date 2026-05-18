import { Router } from "express";
import { 
  getStats, 
  getAllUsers, 
  toggleUserStatus, 
  toggleAdminRole,
  getAllProducts, 
  toggleProductStatus,
  deleteUserAccount
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.post("/users/:id/toggle", toggleUserStatus);
router.post("/users/:id/role", toggleAdminRole);
router.delete("/users/:id", deleteUserAccount);
router.get("/products", getAllProducts);
router.post("/products/:id/toggle", toggleProductStatus);

export default router;
