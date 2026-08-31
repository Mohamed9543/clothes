// Metro config for a pnpm monorepo: pnpm hoists shared deps into the repo
// root node_modules and symlinks workspace packages (e.g. @libas/shared),
// so Metro needs to watch the monorepo root and resolve modules from both
// the app's own node_modules and the root's.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
