import cloudinary from "../config/cloudinary.js";

export async function uploadImages(req, res, next) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.error("Cloudinary credentials are missing in .env");
      return res.status(503).json({ message: "Cloudinary is not configured on the server" });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploads = await Promise.all(
      req.files.map((file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "sellchey/listings",
              resource_type: "image",
              transformation: [{ quality: "auto", fetch_format: "auto", width: 1400, crop: "limit" }]
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary Upload Error:", error);
                reject(error);
              }
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        })
      )
    );

    res.status(201).json({ data: uploads });
  } catch (error) {
    console.error("Upload controller failed:", error);
    next(error);
  }
}
