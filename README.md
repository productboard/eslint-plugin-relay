**This plugin is a fork of [eslint-plugin-relay](https://github.com/relayjs/eslint-plugin-relay)** with some patches applied on top. This fork isn't distributed in any of the package repositories.

# eslint-plugin-relay [![CI](https://github.com/productboard/eslint-plugin-relay/actions/workflows/ci.yml/badge.svg)](https://github.com/productboard/eslint-plugin-relay/actions/workflows/ci.yml) 

`eslint-plugin-relay` is a plugin for [ESLint](http://eslint.org/) to catch common problems in code using [Relay](https://facebook.github.io/relay/) early.

## Install

Point to repository in yout `package.json` file:

```json
{
  "dependencies": {
    "@productboard/eslint-plugin-relay": "productboard/eslint-plugin-relay#vX.X.X"
  }
}
```

Where `X.X.X` should be replaced with tagged version, see [latest tag here](https://github.com/productboard/eslint-plugin-relay/tags).

Run `yarn install` / `npm install`.

## How To Use

1.  Add `"@productboard/relay"` to your eslint `plugins` section.
2.  Add the relay rules such as `"@productboard/relay/graphql-syntax": "error"` to your eslint `rules` section, see the example for all rules.

Example .eslintrc.js:

```js
module.exports = {
  // Other eslint properties here
  rules: {
    '@productboard/relay/graphql-syntax': 'error',
    '@productboard/relay/compat-uses-vars': 'warn',
    '@productboard/relay/graphql-naming': 'error',
    '@productboard/relay/generated-flow-types': 'warn',
    '@productboard/relay/must-colocate-fragment-spreads': 'warn',
    '@productboard/relay/no-future-added-value': 'warn',
    '@productboard/relay/unused-fields': 'warn',
    '@productboard/relay/function-required-argument': 'warn',
    '@productboard/relay/hook-required-argument': 'warn'
  },
  plugins: ['@productboard/relay']
};
```

You can also enable all the recommended or strict rules at once.
Add `plugin:@productboard/relay/recommended` or `plugin:@productboard/relay/strict` in `extends`:

```js
{
  "extends": [
    "plugin:@productboard/relay/recommended"
  ]
}
```

### Suppressing rules within graphql tags

The following rules support suppression within graphql tags:

- `unused-fields`
- `must-colocate-fragment-spreads`

Supported rules can be suppressed by adding `# eslint-disable-next-line @productboard/relay/name-of-rule` to the preceding line:

```js
graphql`fragment foo on Page {
  # eslint-disable-next-line @productboard/relay/must-colocate-fragment-spreads
  ...unused1
}`
```

Note that only the `eslint-disable-next-line` form of suppression works. `eslint-disable-line` doesn't currently work until graphql-js provides support for [parsing Comment nodes](https://github.com/graphql/graphql-js/issues/2241) in their AST.

#### Rule options

##### `no-future-added-value`

You can specify custom error message:

```js
  module.exports = {
      rules: {
        '@productboard/relay/no-future-added-value': [ 'error', {
          message: "My custom message"
        } ],
      }
  }
```

#### `must-colocate-fragment-spreads`

You can allow mark fragment as used when it is imported (defaults to `false`):

```js
  module.exports = {
      rules: {
        '@productboard/relay/must-colocate-fragment-spreads': [
          'error',
          { allowNamedImports: true },
        ],
      }
  }
```


## Contribute

We actively welcome pull requests, learn how to [contribute](./CONTRIBUTING.md).

## License

`eslint-plugin-relay` is [MIT licensed](./LICENSE).
