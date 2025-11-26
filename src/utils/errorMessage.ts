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
    return error;
  }

  if (typeof error === "object") {
    const maybeMessage = (error as Record<string, unknown>).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }

    const maybeDetails = (error as Record<string, unknown>).details;
    if (typeof maybeDetails === "string" && maybeDetails.length > 0) {
      return maybeDetails;
    }

    try {
      return JSON.stringify(error);
    } catch (serializationError) {
      console.warn("Could not serialize error object", serializationError);
      return fallback;
    }
  }

  return String(error);
};
