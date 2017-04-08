# Changelog

This changelog tracks changes starting from first public release.

## master

- Updated all the dependencies as well make sure they're locked down so I do not
go in trouble with these anymore.

- Languages ID have been changed to be lower case. This will help introducing
custom icons for these supported languages. See [#69](https://github.com/XVincentX/vscode-apielements/issues/69) for more details

## v0.6.1

- The entire extension has now been migrated to Typescript 2. Long journey, but we made it.
- Package update with latest parser versions

## v0.6.0

- It is now possible to preview the documentation you're working now currently in Apiary using the appropriate feature. Just look for Apiary: Preview command.

## v0.5.0

- It is now possible to configure what you think it's a Symbol to report and not. All of them are extension parameters and are enabled by default.

- The entire codebase has been linted with `tslint` and will continue to be managed in this way

- When a `token` is grabbed for the internal Apiary Client, this is now tested on the spot so you do not have to wait until the first usage

## v0.4.3

- YAML syntax colorisation has been updated according to the changes made in [VSCode repository](https://github.com/Microsoft/vscode/pull/11666).

- Drafter.js bundled parser was a beta version by mistake - locked to 2.5.0

- Changelog.md file is now being uploaded to MS Servers. Thanks to [my contribution](https://github.com/Microsoft/vscode/issues/11940) next VSCode version will show the changelog directly from the Extension tab.

## v0.4.2

- Provide better error messaging for all failed HTTP requestes.

- The extension is now able to provide the parser output even if there's a parsing error

- Do not throw a error when fetching the same API multiple times as an untitled window

- This extension is not more flagged as preview stuff (finally)

## v0.4.1

- Recall in the README the new feature of browsing an API

## v0.4.0

- The Apiary integrated client is now sending the `shouldCommit` parameter (set it to `true` by default). This was driven by [offical client update](https://github.com/apiaryio/apiary-client/pull/130)

- Browse to API command has been introduced. Just select it on `Apiary` commands and select it. It will try to get the API name from the current file; if it won't be able to understand it, it will show you a dropdown item where you can select the one you want to browse to.

- A debounce value for document validation has been introduced, in order to not flood the server process with useless requests whose content is discarded since another one is coming (this is what usually happens when sending keystrokes). The delay value is configurable and it's default value is `1000ms`. Feel free to adjust it with the value that will make you happy.

- All the long running operations have now a status bar text so that the user knows something is going on. As next step I would like to add a spinner or an animation.

## v0.3.0

- This extension provides now [Swagger](https://swagger.io) support. There might be some limitation due to the [Apiary adapter for API Elements](https://github.com/apiaryio/fury-adapter-swagger) (known issues as well the way it's producing sourcemaps). I'll keep looking/updating the parser as soon the features are improved. There are a lot of code smells I had to put and probably there are different edge cases that won't work propertly. The reason for that is ultimately the will to release this to the public (as it has been strongly requested) as well not waiting for official fix in the parsers (whose I have no control, actually). Users are really invited to file an issue when they encounter those things.

- [transitions]() have been added as a symbol. Those should be really useful, even if probably a bit noisy. During the next release cycle I would like to set symbols as a configurable array.

- In order to provide Swagger support I had to switch to fury, so the automatic parser mechanism had to be killed. All the things are now bundled into the extension itself, and nothing should change. I'll keep update those as soon as new versions are releases (At least, I hope I'll be able to do so).

- All description paths are now decoded using `decodeURI` function. So you will not see anymore `user%2did`, but `user-id`, which is the correct way it should be shown.

- When APIBlueprint document is selected and `adjustOptions` is set to true, this extension will now set spaces as tab separator by default as is the way drafter.js works

- Minimum VSCode version has been highered to 1.4.0 and I'll keep update it as interesting features will be released. Please keep in mind I'll never consider this a breaking change.

- The `json` option for drafter.js has been removed as, using `fury`, all the payload will be converted in JSON anyway.


## v0.2.0

- This extension provides now a basic [Apiary](https://apiary.io) integration. See the [README](./client/README.md) for more informations

- Removed an useless `JSON.parse` and `JSON.stringify` round trip when asking for parser output.

- The editor now adjustes new line, tab size and indend type when switching to an API Blueprint document.

## v0.1.3

- Fixed a bug in path concatenation in Parse Result command which prevend it to work on Windows

- Added help link when sourcemaps are disabled and you request symbols

## v0.1.2

- Provide parser output command

- Support for symbols and parser error on multiple documents

## v0.1.1

- Added `firstLine` element in extension definition so VSCode can recognise API Blueprint documents.

- Clear all related annotations when a document is closed. See [https://code.visualstudio.com/updates#_extension-authoring](VSCode updates) for more details.

- Renamed all references from `APIBlueprint` to `API Blueprint`. Same from `APIElements` to `API Elements`

- Grab the Refract output even when an exception is thrown

- Handle the case when the source map is actually on a new line symbol
