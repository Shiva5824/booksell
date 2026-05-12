import { Router } from "express";
import { getUser, getUserProducts, updateUserProfile } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateUserProfileSchema } from "../validators/user.schema.js";

const router = Router();

router.get("/:id", getUser);
router.get("/:id/products", getUserProducts);
router.put("/profile", requireAuth, validate(updateUserProfileSchema), updateUserProfile);

export default router;
