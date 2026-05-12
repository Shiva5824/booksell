export function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error.name === "CastError") {
    return res.status(404).json({ message: "Resource not found" });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Max size is 3MB" });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ message: "Too many files. Max is 6" });
  }

  if (error.name === "ZodError") {
    console.error("Validation Error Details:", JSON.stringify(error.errors, null, 2));
    return res.status(400).json({ 
      message: "Validation failed", 
      errors: error.errors 
    });
  }

  res.status(error.status || 500).json({
    message: error.message || "Something went wrong"
  });
}
