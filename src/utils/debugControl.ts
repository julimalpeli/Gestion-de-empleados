// Debug control utility to reduce console noise

// Global debug flags
const DEBUG_FLAGS = {
  auth: false, // Authentication logs
  database: false, // Database queries
  employees: false, // Employee operations
  payroll: false, // Payroll operations
  vacations: false, // Vacation operations
  portal: false, // Employee portal logs
  dashboard: false, // Dashboard logs
  api: false, // API calls
  errors: true, // Always show errors
  warnings: true, // Always show warnings
};

// Controlled logging functions
export const debugLog = {
  auth: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.auth) console.log(message, ...args);
  },

  database: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.database) console.log(message, ...args);
  },

  employees: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.employees) console.log(message, ...args);
  },

  payroll: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.payroll) console.log(message, ...args);
  },

  vacations: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.vacations) console.log(message, ...args);
  },

  portal: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.portal) console.log(message, ...args);
  },

  dashboard: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.dashboard) console.log(message, ...args);
  },

  api: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.api) console.log(message, ...args);
  },

  error: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.errors) console.error(message, ...args);
  },

  warn: (message: any, ...args: any[]) => {
    if (DEBUG_FLAGS.warnings) console.warn(message, ...args);
  },
};

// Functions to control debug levels
export const enableDebug = (category: keyof typeof DEBUG_FLAGS) => {
  DEBUG_FLAGS[category] = true;
  console.log(`✅ Debug enabled for: ${category}`);
};

export const disableDebug = (category: keyof typeof DEBUG_FLAGS) => {
  DEBUG_FLAGS[category] = false;
  console.log(`❌ Debug disabled for: ${category}`);
};

export const enableAllDebug = () => {
  Object.keys(DEBUG_FLAGS).forEach((key) => {
    DEBUG_FLAGS[key as keyof typeof DEBUG_FLAGS] = true;
  });
  console.log("✅ All debug logging enabled");
};

export const disableAllDebug = () => {
  Object.keys(DEBUG_FLAGS).forEach((key) => {
    DEBUG_FLAGS[key as keyof typeof DEBUG_FLAGS] = false;
  });
  // Keep errors and warnings enabled
  DEBUG_FLAGS.errors = true;
  DEBUG_FLAGS.warnings = true;
  console.log("❌ All debug logging disabled (except errors/warnings)");
};

export const showDebugStatus = () => {
  console.log("🔧 Debug Status:");
  Object.entries(DEBUG_FLAGS).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? "✅" : "❌"}`);
  });
};

export const silentMode = () => {
  Object.keys(DEBUG_FLAGS).forEach((key) => {
    DEBUG_FLAGS[key as keyof typeof DEBUG_FLAGS] = false;
  });
  console.log("🔇 Silent mode activated - all logging disabled");
};

// Quick access functions for common scenarios
export const debugModeProduction = () => {
  silentMode();
  DEBUG_FLAGS.errors = true;
  console.log("🎯 Production mode: Only errors will be logged");
};

export const debugModeDevelopment = () => {
  disableAllDebug();
  DEBUG_FLAGS.errors = true;
  DEBUG_FLAGS.warnings = true;
  DEBUG_FLAGS.auth = true;
  console.log("🛠️ Development mode: Errors, warnings, and auth logs enabled");
};

export const debugModeVerbose = () => {
  enableAllDebug();
  console.log("📢 Verbose mode: All debugging enabled");
};

// Make functions globally available for console use
if (typeof window !== "undefined") {
  (window as any).enableDebug = enableDebug;
  (window as any).disableDebug = disableDebug;
  (window as any).enableAllDebug = enableAllDebug;
  (window as any).disableAllDebug = disableAllDebug;
  (window as any).showDebugStatus = showDebugStatus;
  (window as any).silentMode = silentMode;
  (window as any).debugModeProduction = debugModeProduction;
  (window as any).debugModeDevelopment = debugModeDevelopment;
  (window as any).debugModeVerbose = debugModeVerbose;

  console.log("🔧 Debug control functions loaded:");
  console.log("   - silentMode() - Turn off all console output");
  console.log("   - debugModeProduction() - Only errors");
  console.log("   - debugModeDevelopment() - Errors + warnings + auth");
  console.log("   - debugModeVerbose() - All debugging");
  console.log("   - showDebugStatus() - Show current debug settings");
  console.log("   - enableDebug('category') / disableDebug('category')");
}

// Start in production mode by default
debugModeProduction();
