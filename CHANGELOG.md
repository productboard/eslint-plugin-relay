# Changelog

## v1.9.4

- rule `unused-fields` has additional functionality which allows you to pass option `edgesAndNodesWhiteListFunctionName`, this is a name of a function and if that function receives an object with `edges` as argument, it will ignore `edges` and `node` warning for unused fields because it considers them to be used inside this function

## v1.9.3

- allow to pass custom error message to `no-future-added-value` rule
- update installation instructions and fix README

## v1.9.2

- fix inability to use `disable-next-line` comments

## v1.9.1

- remove `release` Github workflow since this repository does not package the library
- change namespace to `@productboard/`

## v1.9.0

- `must-colocate-fragment-spreads` rule now accepts the optional `allowNamedImports` option that can be set to true (defaults to false) to allow marking a fragment as used when there is a matching named import:

    ```js
    import { MyComponent } from '../shared';

    graphql`fragment foo on Page {
        ...myComponent_fragment
    }`;
    ```
