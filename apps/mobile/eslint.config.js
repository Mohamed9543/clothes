const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      // Flags the standard "setLoading(true); fetch().then(...).finally(() =>
      // setLoading(false))" pattern used throughout this app (and the rest of
      // the monorepo, where this rule isn't enabled) — not a real bug here.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
