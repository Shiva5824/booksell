import { Router } from "express";
import { getUser, getUserProducts, updateUserProfile, checkPhoneExists, addLocation, updateLocation, deleteLocation } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateUserProfileSchema } from "../validators/user.schema.js";

const router = Router();

// More specific routes first
router.get("/check/phone", requireAuth, checkPhoneExists);
router.put("/profile", requireAuth, validate(updateUserProfileSchema), updateUserProfile);

// Location routes
router.post("/location", requireAuth, addLocation);
router.put("/location/:locationId", requireAuth, updateLocation);
router.delete("/location/:locationId", requireAuth, deleteLocation);

// General routes (less specific)
router.get("/:id", getUser);
router.get("/:id/products", getUserProducts);

export default router;
