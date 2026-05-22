import { Router } from "express";
import { getSiteContact, updateSiteContact, getCarouselMedia, createCarouselMedia, updateCarouselMedia, deleteCarouselMedia, reorderCarouselMedia } from "../controllers/site.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

router.get("/contact", getSiteContact);
router.post("/contact", requireAuth, requireAdmin, updateSiteContact);

// Carousel media endpoints - NOTE: specific routes must come before :id routes
router.get("/media", getCarouselMedia);
router.post("/media", requireAuth, requireAdmin, createCarouselMedia);
router.put("/media/reorder", requireAuth, requireAdmin, reorderCarouselMedia); // Must come BEFORE /:id
router.put("/media/:id", requireAuth, requireAdmin, updateCarouselMedia);
router.delete("/media/:id", requireAuth, requireAdmin, deleteCarouselMedia);

export default router;
