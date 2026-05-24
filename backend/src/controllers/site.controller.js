import SiteSetting from "../models/SiteSetting.js";
import SiteMedia from "../models/SiteMedia.js";

export async function getSiteContact(_req, res, next) {
  try {
    const setting = await SiteSetting.findOne().sort({ createdAt: -1 });
    if (!setting) return res.json({ data: { supportEmail: "", whatsappNumber: "" } });
    res.json({ data: { supportEmail: setting.supportEmail || "", whatsappNumber: setting.whatsappNumber || "" } });
  } catch (error) {
    next(error);
  }
}

export async function updateSiteContact(req, res, next) {
  try {
    const { supportEmail, whatsappNumber } = req.body || {};
    const email = supportEmail ? String(supportEmail).trim() : "";
    const whatsapp = whatsappNumber ? String(whatsappNumber).replace(/\D/g, "").trim() : "";

    const setting = await SiteSetting.findOneAndUpdate({}, { supportEmail: email, whatsappNumber: whatsapp }, { new: true, upsert: true });
    res.json({ data: { supportEmail: setting.supportEmail, whatsappNumber: setting.whatsappNumber } });
  } catch (error) {
    next(error);
  }
}

// Carousel Media Management
const VALID_SECTIONS = ["hero", "cta"];
function normalizeSection(value) {
  const v = (value || "").toString().toLowerCase();
  return VALID_SECTIONS.includes(v) ? v : "hero";
}

export async function getCarouselMedia(req, res, next) {
  try {
    const section = normalizeSection(req.query?.section);
    const media = await SiteMedia.find({ section }).sort({ order: 1 });
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
}

export async function createCarouselMedia(req, res, next) {
  try {
    const { imageUrl, title, description, order, section } = req.body;
    const sec = normalizeSection(section);

    // Check if already at 10 images for this section
    const count = await SiteMedia.countDocuments({ section: sec });
    if (count >= 10) {
      return res.status(400).json({ error: "Maximum 10 carousel images allowed per section" });
    }

    const media = new SiteMedia({
      imageUrl,
      title: title || "",
      description: description || "",
      section: sec,
      order: order || count + 1,
      uploadedBy: req.user?._id || "admin"
    });
    
    await media.save();
    res.status(201).json({ data: media });
  } catch (error) {
    next(error);
  }
}

export async function updateCarouselMedia(req, res, next) {
  try {
    const { id } = req.params;
    const { imageUrl, title, description, order, section } = req.body;

    const updates = {};
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (order !== undefined) updates.order = order;
    if (section !== undefined) updates.section = normalizeSection(section);

    const media = await SiteMedia.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }
    
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
}

export async function deleteCarouselMedia(req, res, next) {
  try {
    const { id } = req.params;
    const media = await SiteMedia.findByIdAndDelete(id);
    
    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }
    
    // Reorder remaining items in the same section.
    const section = media.section || "hero";
    const remaining = await SiteMedia.find({ section }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i + 1;
      await remaining[i].save();
    }
    
    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function reorderCarouselMedia(req, res, next) {
  try {
    const { items, section } = req.body; // Array of {id, order}
    const sec = normalizeSection(section);

    for (const item of items) {
      await SiteMedia.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    const media = await SiteMedia.find({ section: sec }).sort({ order: 1 });
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
}
