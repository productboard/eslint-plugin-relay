/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var eslint = require('eslint');

const rules = require('..').rules;
const RuleTester = eslint.RuleTester;

const ruleTester = new RuleTester({
  parser: require.resolve('babel-eslint'),
  parserOptions: {ecmaVersion: 6, sourceType: 'module'}
});

function unusedFieldsWarning(fragment) {
  return (
    `This spreads the fragment \`${fragment}\` but ` +
    `this module does not use it directly or the fragment is named incorrectly. If a different module ` +
    `needs the data from this fragment, that module should directly define it's own fragment ` +
    `to query for it's own data, and such fragment should be spread in the parent component.` +
    `The naming convention is <nameOfComponentCamelCase>_<optionalSuffix>. ` +
    `The <nameOfComponentCamelCase> must match the import name. The optional suffix should be separated ` +
    `by underscore (usually when you need to pass multiple fragments to the same component).` +
    `See: https://pb.dev/docs/default/component/pb-frontend/data-fetching/02-relay-patterns/#fragments\n`
  );
}

ruleTester.run(
  'must-colocate-fragment-spreads',
  rules['must-colocate-fragment-spreads'],
  {
    valid: [
      `
      import { Component } from '../shared/component.js';
      graphql\`fragment foo on Page {
        ...component_fragment
      }\`;
      `,
      {
        code: `
        import { Component } from '../shared';
        graphql\`fragment foo on Page {
          ...component_fragment
        }\`;
        `,
        options: [{allowNamedImports: true}]
      },
      `
      const Component = require('../shared/component.js');
      graphql\`fragment foo on Page {
        ...component_fragment
      }\`;
      `,
      `
      const Component = import('../shared/component.js');
      graphql\`fragment foo on Page {
        ...component_fragment
      }\`;
      `,
      `
      import { Component } from './nested/componentModule.js';
      graphql\`fragment foo on Page {
        ...componentModule_fragment
      }\`;
      `,
      `
      import { Component } from './component-module.js';
      graphql\`fragment foo on Page {
        ...componentModuleFragment
      }\`;
      `,
      `
      import { Component } from './component-module.js';
      graphql\`query Root {
        ...componentModuleFragment
      }\`;
      `,
      `
      graphql\`fragment foo1 on Page {
        name
      }\`;
      graphql\`fragment foo2 on Page {
        ...foo1
      }\`;
      `,
      `
      graphql\`mutation {
        page_unlike(data: $input) {
          ...component_fragment
          ...componentFragment
          ...component
        }
      }\`
      `,
      `
      graphql\`fragment foo on Page { ...Fragment @relay(mask: false) }\`;
      `,
      `
      graphql\`fragment foo on Page { ...Fragment @module(name: "ComponentName.react") }\`;
      `,
      '\
      const getOperation = (reference) => {\
        return import(`./src/__generated__/${reference}`);\
      };\
      ',
      '\
      const getOperation = (reference) => {\
        return import(reference);\
      };\
      ',
      `
      graphql\`fragment foo on Page {
        # eslint-disable-next-line @productboard/relay/must-colocate-fragment-spreads
        ...unused1
      }\`;
      `
    ],
    invalid: [
      {
        code: `
        graphql\`fragment foo on Page { ...unused1 }\`;
        `,
        errors: [
          {
            message: unusedFieldsWarning('unused1'),
            line: 2
          }
        ]
      },
      {
        code: `
        import { ComponentAnother } from '../shared';
        graphql\`fragment foo on Page {
          ...component_fragment
        }\`;
        `,
        options: [{allowNamedImports: true}],
        errors: [
          {
            message: unusedFieldsWarning('component_fragment'),
            line: 4
          }
        ]
      },
      {
        code: `
        import { Component } from '../shared';
        graphql\`fragment foo on Page {
          ...component_fragment
        }\`;
        `,
        options: [{allowNamedImports: false}],
        errors: [
          {
            message: unusedFieldsWarning('component_fragment'),
            line: 4
          }
        ]
      },
      {
        code: `
        graphql\`fragment Test on Page { ...unused1, ...unused2 }\`;
        `,
        errors: [unusedFieldsWarning('unused1'), unusedFieldsWarning('unused2')]
      },
      {
        code: `
        graphql\`query Root { ...unused1 }\`;
        `,
        errors: [
          {
            message: unusedFieldsWarning('unused1'),
            line: 2
          }
        ]
      },
      {
        code: `
        import { Component } from './used1.js';
        graphql\`fragment foo on Page { ...used1 ...unused1 }\`;
        `,
        errors: [unusedFieldsWarning('unused1')]
      },
      {
        code: `
        graphql\`fragment foo on Page { ...unused1 @relay(mask: true) }\`;
        `,
        errors: [unusedFieldsWarning('unused1')]
      },
      {
        code: `
        import type { MyType } from '../shared/component.js';
        graphql\`fragment foo on Page {
          ...component_fragment
        }\`;
        `,
        errors: [unusedFieldsWarning('component_fragment')]
      }
    ]
  }
);
