import SiteSetting from "../models/SiteSetting.js";

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
