/**
 * Format MongoDB validation errors into a readable object
 */
export function formatValidationError(error) {
  const errors = {};
  
  if (error.errors) {
    Object.keys(error.errors).forEach((key) => {
      errors[key] = error.errors[key].message;
    });
  }
  
  return errors;
}

export default formatValidationError;