/**
 * Version configuration
 * Update this version whenever you make a new release
 * Follow semantic versioning: MAJOR.MINOR.PATCH
 */

export const APP_VERSION = "1.1.1";

export const getVersionString = (): string => {
  return `v${APP_VERSION}`;
};
