/**
 * Feature flags for enabling/disabling application features
 * These can be toggled to enable or disable features without removing code
 */

export const FeatureFlags = {
  /**
   * Enable/disable the application sidebar
   * When false, sidebar and sidebar trigger are hidden
   * When true, sidebar functionality is fully enabled
   */
  SIDEBAR_ENABLED: false,

  /**
   * Add other feature flags here as needed
   * Example:
   * AI_FEATURES_ENABLED: true,
   * EXPERIMENTAL_FEATURES: false,
   */
} as const;

export type FeatureFlagKey = keyof typeof FeatureFlags;
