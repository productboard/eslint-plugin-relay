# Changelog

## v1.9.0

- `must-colocate-fragment-spreads` rule now accepts the optional `allowNamedImports` option that can be set to true (defaults to false) to allow marking a fragment as used when there is a matching named import:

    ```js
    import { MyComponent } from '../shared';

    graphql`fragment foo on Page {
        ...myComponent_fragment
    }`;
    ```
