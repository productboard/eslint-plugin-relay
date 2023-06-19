/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = {
  rules: {
    'graphql-syntax': require('./src/rule-graphql-syntax'),
    'compat-uses-vars': require('./src/rule-compat-uses-vars'),
    'graphql-naming': require('./src/rule-graphql-naming'),
    'generated-flow-types': require('./src/rule-generated-flow-types'),
    'no-future-added-value': require('./src/rule-no-future-added-value'),
    'unused-fields': require('./src/rule-unused-fields'),
    'must-colocate-fragment-spreads': require('./src/rule-must-colocate-fragment-spreads'),
    'function-required-argument': require('./src/rule-function-required-argument'),
    'hook-required-argument': require('./src/rule-hook-required-argument')
  },
  configs: {
    recommended: {
      rules: {
        '@productboard/relay/graphql-syntax': 'error',
        '@productboard/relay/compat-uses-vars': 'warn',
        '@productboard/relay/graphql-naming': 'error',
        '@productboard/relay/generated-flow-types': 'warn',
        '@productboard/relay/no-future-added-value': 'warn',
        '@productboard/relay/unused-fields': 'warn',
        '@productboard/relay/must-colocate-fragment-spreads': 'warn',
        '@productboard/relay/function-required-argument': 'warn',
        '@productboard/relay/hook-required-argument': 'warn'
      }
    },
    strict: {
      rules: {
        '@productboard/relay/graphql-syntax': 'error',
        '@productboard/relay/compat-uses-vars': 'error',
        '@productboard/relay/graphql-naming': 'error',
        '@productboard/relay/generated-flow-types': 'error',
        '@productboard/relay/no-future-added-value': 'error',
        '@productboard/relay/unused-fields': 'error',
        '@productboard/relay/must-colocate-fragment-spreads': 'error',
        '@productboard/relay/function-required-argument': 'error',
        '@productboard/relay/hook-required-argument': 'error'
      }
    }
  }
};
