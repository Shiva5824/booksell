export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      console.error("Zod Validation Error:", JSON.stringify(result.error.flatten(), null, 2));
      console.error("Request Body:", req.body);
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten()
      });
    }

    req.validated = result.data;
    next();
  };
}
