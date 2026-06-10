import { describe, it, expect } from 'vitest';

/**
 * Unit tests for appConfig (US-002)
 *
 * Verifies that the Angular application config registers the expected
 * Firebase providers (provideFirebaseApp, provideFirestore, provideAuth)
 * alongside the base Angular providers (router, errorListeners).
 *
 * Strategy: inspect appConfig.providers structurally — count and non-null
 * presence — without instantiating them (which would require a live Firebase
 * project).
 */
describe('appConfig — Firebase provider registration (US-002)', () => {
  it('should expose providers as a non-empty array', async () => {
    const { appConfig } = await import('./app.config');
    expect(appConfig.providers).toBeDefined();
    expect(Array.isArray(appConfig.providers)).toBe(true);
    expect((appConfig.providers as unknown[]).length).toBeGreaterThanOrEqual(5);
  });

  it('should register at least 5 providers (router + errorListeners + 3 Firebase)', async () => {
    const { appConfig } = await import('./app.config');
    // provideRouter, provideBrowserGlobalErrorListeners,
    // provideFirebaseApp, provideFirestore, provideAuth
    const providers = appConfig.providers as unknown[];
    expect(providers.length).toBeGreaterThanOrEqual(5);
  });

  it('should not include any null or undefined provider entries', async () => {
    const { appConfig } = await import('./app.config');
    const providers = appConfig.providers as unknown[];
    providers.forEach((p) => {
      expect(p).not.toBeNull();
      expect(p).not.toBeUndefined();
    });
  });

  it('all providers should be objects (EnvironmentProviders or provider records)', async () => {
    const { appConfig } = await import('./app.config');
    const providers = appConfig.providers as unknown[];
    providers.forEach((p) => {
      expect(typeof p).toBe('object');
    });
  });
});
