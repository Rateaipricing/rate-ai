const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase ESM compatibility (required for both native and web)
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Prefer browser/web builds of packages when bundling for web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
