export const getReadableErrorMessage = (
  error: unknown,
  fallback = "Error desconocido",
): string => {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error.length > 0 ? error : fallback;
  }

  if (typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    
    // Try to get message property
    const maybeMessage = errorObj.message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }

    // Try to get details property
    const maybeDetails = errorObj.details;
    if (typeof maybeDetails === "string" && maybeDetails.length > 0) {
      return maybeDetails;
    }

    // Try to get hint property (Supabase specific)
    const maybeHint = errorObj.hint;
    if (typeof maybeHint === "string" && maybeHint.length > 0) {
      return maybeHint;
    }

    // Try to get code property (Supabase specific)
    const maybeCode = errorObj.code;
    if (typeof maybeCode === "string" && maybeCode.length > 0) {
      return `Error code: ${maybeCode}`;
    }

    // Try to serialize the error, but ensure it's not just "[object Object]"
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}" && !serialized.includes("[object Object]")) {
        return serialized;
      }
    } catch (serializationError) {
      console.warn("Could not serialize error object", serializationError);
    }

    // Last resort: return a descriptive message
    return fallback;
  }

  // Final fallback for edge cases
  const stringified = String(error);
  return stringified && stringified !== "[object Object]" ? stringified : fallback;
};
