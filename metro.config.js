// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Permite requerir .xlsx como asset
config.resolver.assetExts = [...config.resolver.assetExts, 'xlsx'];

module.exports = config;
