# Troubleshot section

## No sourcemaps enabled

### Error Message:

```
The current parser options have source maps disabled.
Without those, it's not possible to generate document symbol.
```

### Explanation:

This extensions requires [source maps](http://api-elements.readthedocs.io/en/latest/element-definitions/#source-map-base-api-element) in order to compute symbols presence and their location. This feature is usually enabled by default when installing the extension. If for some reason you're getting this error, it means they are not getting generated.

The option driving the generation is [configurable in VSCode](https://github.com/XVincentX/vscode-apielements/blob/master/client/package.json#L53). Make sure the option is not being overridden in your [user or workspace settings](https://code.visualstudio.com/docs/customization/userandworkspace)
