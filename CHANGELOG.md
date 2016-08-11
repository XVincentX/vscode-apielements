# Changelog

This changelog tracks changes starting from first public release.

## v0.3.0

- This extension provides now [Swagger](https://swagger.io) support. There might be some limitation due to the [Apiary Parser]() (known issues as well the way it's producing sourcemaps). I'll keep looking/updating the parser as soon the features are improved.

- [transitions]() have been added as a symbol. Those should be really useful, even if probably a bit noisy. During the next release cycle I would like to set symbols as a configurable array.

- In order to provide Swagger support I had to switch to fury, so the automatic parser mechanism had to be killed. All the things are now bundled into the extension itself, and nothing should change. I'll keep update those as soon as new versions are releases.


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
