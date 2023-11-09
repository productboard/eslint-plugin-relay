/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {
  getGraphQLAST,
  getLoc,
  hasPrecedingEslintDisableComment
} = require('./utils');

const ESLINT_DISABLE_COMMENT =
  ' eslint-disable-next-line @productboard/relay/unused-fields';

function getGraphQLFieldNames(graphQLAst) {
  const fieldNames = {};
  const edgesParents = [];

  function walkAST(node, ignoreLevel) {
    if (node.kind === 'Field' && !ignoreLevel) {
      if (hasPrecedingEslintDisableComment(node, ESLINT_DISABLE_COMMENT)) {
        return;
      }
      const nameNode = node.alias || node.name;
      fieldNames[nameNode.value] = nameNode;

      if (node.kind === 'Field' && node.selectionSet && containsEdges(node)) {
        edgesParents.push(node.name.value);
      }
    }
    if (node.kind === 'OperationDefinition') {
      if (
        node.operation === 'mutation' ||
        node.operation === 'subscription' ||
        hasPrecedingEslintDisableComment(node, ESLINT_DISABLE_COMMENT)
      ) {
        return;
      }
      // Ignore fields that are direct children of query as used in mutation
      // or query definitions.
      node.selectionSet.selections.forEach(selection => {
        walkAST(selection, true);
      });
      return;
    }

    for (const prop in node) {
      const value = node[prop];
      if (prop === 'loc') {
        continue;
      }
      if (value && typeof value === 'object') {
        walkAST(value);
      } else if (Array.isArray(value)) {
        value.forEach(child => {
          walkAST(child);
        });
      }
    }
  }

  walkAST(graphQLAst);

  return {fieldNames, edgesParents};
}

function isGraphQLTemplate(node) {
  return (
    node.tag.type === 'Identifier' &&
    node.tag.name === 'graphql' &&
    node.quasi.quasis.length === 1
  );
}

function isStringNode(node) {
  return (
    node != null && node.type === 'Literal' && typeof node.value === 'string'
  );
}

function isPageInfoField(field) {
  switch (field) {
    case 'pageInfo':
    case 'page_info':
    case 'hasNextPage':
    case 'has_next_page':
    case 'hasPreviousPage':
    case 'has_previous_page':
    case 'startCursor':
    case 'start_cursor':
    case 'endCursor':
    case 'end_cursor':
      return true;
    default:
      return false;
  }
}

function containsEdges(node) {
  return node.selectionSet.selections.some(
    selection =>
      selection.name && selection.name.value && selection.name.value === 'edges'
  );
}

function rule(context) {
  const edgesAndNodesWhiteListFunctionName = context.options[0]
    ? context.options[0].edgesAndNodesWhiteListFunctionName
    : null;
  let currentMethod = [];
  let foundMemberAccesses = {};
  let templateLiterals = [];
  const edgesAndNodesWhiteListFunctionCalls = [];

  function visitGetByPathCall(node) {
    // The `getByPath` utility accesses nested fields in the form
    // `getByPath(thing, ['field', 'nestedField'])`.
    const pathArg = node.arguments[1];
    if (!pathArg || pathArg.type !== 'ArrayExpression') {
      return;
    }
    pathArg.elements.forEach(element => {
      if (isStringNode(element)) {
        foundMemberAccesses[element.value] = true;
      }
    });
  }

  function visitDotAccessCall(node) {
    // The `dotAccess` utility accesses nested fields in the form
    // `dotAccess(thing, 'field.nestedField')`.
    const pathArg = node.arguments[1];
    if (isStringNode(pathArg)) {
      pathArg.value.split('.').forEach(element => {
        foundMemberAccesses[element] = true;
      });
    }
  }

  function visitMemberExpression(node) {
    if (node.property.type === 'Identifier') {
      foundMemberAccesses[node.property.name] = true;
    }
  }

  function getEdgesAndNodesWhiteListFunctionCallArguments(calls) {
    return calls.flatMap(call =>
      call.arguments.map(arg => {
        if (arg.type === 'Identifier') {
          return arg.name;
        } else if ('expression' in arg) {
          return arg.expression.property.name;
        } else if ('property' in arg) {
          return arg.property.name;
        }
        return null;
      })
    );
  }

  // Naively checks whether the function call for
  // `edgesAndNodesWhiteListFunctionName` contains arguments
  // that are property accesses on a field that contains
  // `edges`
  function wasWhiteListFunctionCalledWithEdgesAndNodesArgument(
    edgesParents,
    callArguments
  ) {
    const callArgumentsSet = new Set([...callArguments]);
    const edgesParentsSet = new Set([...edgesParents]);
    const intersect = new Set(
      [...callArgumentsSet].filter(callArgument =>
        edgesParentsSet.has(callArgument)
      )
    );

    return intersect.size > 0;
  }

  function shouldIgnoreWhiteListedCollectConnectionFields(
    field,
    whiteListFunctionCalledWithEdgesAndNodes
  ) {
    return (
      (field === 'edges' || field === 'node') &&
      whiteListFunctionCalledWithEdgesAndNodes
    );
  }

  return {
    Program(_node) {
      currentMethod = [];
      foundMemberAccesses = {};
      templateLiterals = [];
    },
    'Program:exit'(node) {
      const edgesAndNodesWhiteListFunctionCallArguments =
        getEdgesAndNodesWhiteListFunctionCallArguments(
          edgesAndNodesWhiteListFunctionCalls
        );
      templateLiterals.forEach(templateLiteral => {
        const graphQLAst = getGraphQLAST(templateLiteral);
        if (!graphQLAst) {
          // ignore nodes with syntax errors, they're handled by rule-graphql-syntax
          return;
        }

        const {fieldNames: queriedFields, edgesParents} =
          getGraphQLFieldNames(graphQLAst);

        const whiteListFunctionCalledWithEdgesAndNodes =
          wasWhiteListFunctionCalledWithEdgesAndNodesArgument(
            edgesParents,
            edgesAndNodesWhiteListFunctionCallArguments
          );

        for (const field in queriedFields) {
          if (
            !foundMemberAccesses[field] &&
            !isPageInfoField(field) &&
            // Do not warn for unused __typename which can be a workaround
            // when only interested in existence of an object.
            field !== '__typename' &&
            !shouldIgnoreWhiteListedCollectConnectionFields(
              field,
              whiteListFunctionCalledWithEdgesAndNodes
            )
          ) {
            context.report({
              node,
              loc: getLoc(context, templateLiteral, queriedFields[field]),
              message:
                `This queries for the field \`${field}\` but this file does ` +
                'not seem to use it directly. If a different file needs this ' +
                'information that file should export a fragment and colocate ' +
                'the query for the data with the usage.\n' +
                'If only interested in the existence of a record, __typename ' +
                'can be used without this warning.'
            });
          }
        }
      });
    },
    CallExpression(node) {
      if (node.callee.type !== 'Identifier') {
        return;
      }
      switch (node.callee.name) {
        case edgesAndNodesWhiteListFunctionName:
          edgesAndNodesWhiteListFunctionCalls.push(node);
          break;
        case 'getByPath':
          visitGetByPathCall(node);
          break;
        case 'dotAccess':
          visitDotAccessCall(node);
          break;
      }
    },
    TaggedTemplateExpression(node) {
      if (currentMethod[0] === 'getConfigs') {
        return;
      }
      if (isGraphQLTemplate(node)) {
        templateLiterals.push(node);
      }
    },
    MemberExpression: visitMemberExpression,
    OptionalMemberExpression: visitMemberExpression,
    ObjectPattern(node) {
      node.properties.forEach(node => {
        if (node.type === 'Property' && !node.computed) {
          foundMemberAccesses[node.key.name] = true;
        }
      });
    },
    MethodDefinition(node) {
      currentMethod.unshift(node.key.name);
    },
    'MethodDefinition:exit'(_node) {
      currentMethod.shift();
    }
  };
}

module.exports = {
  meta: {
    docs: {
      description: 'Warns about unused fields in graphql queries'
    },
    schema: [
      {
        type: 'object',
        properties: {
          edgesAndNodesWhiteListFunctionName: {
            type: 'string'
          }
        },
        additionalProperties: false
      }
    ]
  },
  create: rule
};
