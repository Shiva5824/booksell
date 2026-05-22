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
export async function getCarouselMedia(_req, res, next) {
  try {
    const media = await SiteMedia.find().sort({ order: 1 });
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
}

export async function createCarouselMedia(req, res, next) {
  try {
    const { imageUrl, title, description, order } = req.body;
    
    // Check if already at 10 images
    const count = await SiteMedia.countDocuments();
    if (count >= 10) {
      return res.status(400).json({ error: "Maximum 10 carousel images allowed" });
    }

    const media = new SiteMedia({
      imageUrl,
      title: title || "",
      description: description || "",
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
    const { imageUrl, title, description, order } = req.body;
    
    const media = await SiteMedia.findByIdAndUpdate(
      id,
      { imageUrl, title, description, order },
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
    
    // Reorder remaining items
    const remaining = await SiteMedia.find().sort({ order: 1 });
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
    const { items } = req.body; // Array of {id, order}
    
    for (const item of items) {
      await SiteMedia.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    const media = await SiteMedia.find().sort({ order: 1 });
    res.json({ data: media });
  } catch (error) {
    next(error);
  }
}
