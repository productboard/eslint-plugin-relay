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

function unusedFieldsWarning(field) {
  return (
    `This queries for the field \`${field}\` but this file does ` +
    'not seem to use it directly. If a different file needs this ' +
    'information that file should export a fragment and colocate ' +
    'the query for the data with the usage.\n' +
    'If only interested in the existence of a record, __typename ' +
    'can be used without this warning.'
  );
}

ruleTester.run('unused-fields', rules['unused-fields'], {
  valid: [
    `
      graphql\`fragment foo on Page { name2 }\`;
      props.page.name;
      foo.name2;
    `,
    'graphql`fragment foo on Page { __typename }`;',
    // Syntax error is ignored by this rule
    `graphql\`fragment Test { name2 }\`;`,
    `
      graphql\`fragment Test on InternalTask {
        owner: task_owner {
          name: full_name
        }
      }\`;
      node.owner.name;
    `,
    'graphql`fragment Test on Page { ...Other_x }`;',
    `
      const {
        normal,
        aliased: v1,
        [computed]: x,
        nested: { v2 },
        ...rest
      } = foo;
    `,
    'graphql`mutation { page_unlike(data: $input) }`',
    'String.raw`foo bar`',
    // Facebook naming of page info fields
    `
      graphql\`
        fragment foo on Page {
          page_info {
             has_next_page
             has_previous_page
             end_cursor
             start_cursor
          }
        }
      \`;
    `,
    // OSS naming of page info fields
    `
      graphql\`
        fragment foo on Page {
          pageInfo {
             hasNextPage
             hasPreviousPage
             endCursor
             startCursor
          }
        }
      \`;
    `,
    `
      graphql\`fragment foo on Page {
        # eslint-disable-next-line @productboard/relay/unused-fields
        name
      }\`;
    `,
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes(data.fields);

    const ids = nodes.map((node) => node.id);
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;
    graphql\`fragment bar on Page {
      items {
        edges {
          node {
            id
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes(data.fields);

    const ids = nodes.map((node) => node.id);

    const otherNodes = collectConnectionNodes(data.items);

    const otherIds = otherNodes.map((node) => node.id);
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        __id
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes(data.fields);
    const firstNode = nodes[0].id;

    const connectionId = data.fields.__id;
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        __id
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes(data?.fields);
    const firstNode = nodes[0].id;

    const connectionId = data.fields.__id;
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        __id
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const { fields } = data;
    const nodes = collectConnectionNodes(fields);
    const firstNode = nodes[0].id;

    const connectionId = fields.__id;
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    },
    {
      code: `
    graphql\`query fields($id: ID!) {
      node(id: $id) {
        fields {
          __id
          edges {
            node {
              __typename
              id
            }
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes(data.node.fields);
    const firstNode = nodes[0].id;

    const connectionId = data.fields.__id;
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}]
    }
  ],
  invalid: [
    {
      code: `
        graphql\`
          fragment Test on Page {
            name
            name2
          }
        \`;
        props.page.name;
      `,
      errors: [
        {
          message: unusedFieldsWarning('name2'),
          line: 5
        }
      ]
    },
    {
      code: `
        graphql\`fragment Test on Page { unused1, unused2 }\`;
      `,
      errors: [unusedFieldsWarning('unused1'), unusedFieldsWarning('unused2')]
    },
    {
      code: `
        const getByPath = require('getByPath');
        graphql\`fragment Test on Page { unused1, used1, used2 }\`;
        alert(getByPath(obj, ['foo', 'used1', 'used2']))
      `,
      errors: [unusedFieldsWarning('unused1')]
    },
    {
      code: `
        graphql\`fragment Test on Page { unused1, used1, used2 }\`;
        obj?.foo?.used1?.used2;
      `,
      errors: [unusedFieldsWarning('unused1')]
    },
    {
      code: `
        const dotAccess = require('dotAccess');
        graphql\`fragment Test on Page { unused1, used1, used2 }\`;
        alert(dotAccess(obj, 'foo.used1.used2'))
      `,
      errors: [unusedFieldsWarning('unused1')]
    },
    {
      code: `
        graphql\`fragment Test on Page {
          unused1
          unused2
          used1
          used2
          used3
          used4
        }\`;
        var { used1: unused1, used2: {used3} } = node;
        function test({used4}) {
          return x;
        }
      `,
      errors: [
        {
          message: unusedFieldsWarning('unused1'),
          line: 3
        },
        {
          message: unusedFieldsWarning('unused2'),
          line: 4
        }
      ]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const nodes = filterSomeData(data.fields);

    const ids = nodes.map((node) => node.id);
    `,
      errors: [
        {
          message: unusedFieldsWarning('edges'),
          line: 4
        },
        {
          message: unusedFieldsWarning('node'),
          line: 5
        }
      ]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        edges {
          node {
            __typename
            id
          }
        }
      }
    }\`;

    const nodes = collectConnectionNodes_TYPO(data.fields);

    const ids = nodes.map((node) => node.id);
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}],
      errors: [
        {
          message: unusedFieldsWarning('edges'),
          line: 4
        },
        {
          message: unusedFieldsWarning('node'),
          line: 5
        }
      ]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        name
      }
    }\`;

    const nodes = collectConnectionNodes(data.fields);

    const ids = nodes.map((node) => node.id);
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}],
      errors: [
        {
          message: unusedFieldsWarning('name'),
          line: 4
        }
      ]
    },
    {
      code: `
    graphql\`fragment foo on Page {
      fields {
        name
      }
    }\`;

    const nodes = collectConnectionNodes(data.unrelatedData);
    `,
      options: [{edgesAndNodesWhiteListFunctionName: 'collectConnectionNodes'}],
      errors: [
        {
          message: unusedFieldsWarning('fields'),
          line: 3
        },
        {
          message: unusedFieldsWarning('name'),
          line: 4
        }
      ]
    }
  ]
});
