## [ApiElements](http://api-elements.readthedocs.io/en/latest/) for Visual Studio Code

Welcome to the Api Elements for Visual Studio Code! This extension provides some
nice and interesting features for people working with API Elements

### What's API Elements about?

Api Elements is the [refract]() namespace behind [APIBlueprint](https://apiblueprint.org) and [Swagger](https://swagger.io).
It means that this extension will improve your experience while working with those API Description formats.

### Features (all of them are wonky so far)

* Syntax highlight (better one)
* Provide parser error and warnings

### Ideas

* Syntax highlight (better one)
* Provide parser error and warnings
* Provide contextual symbols navigation (can be hard, but appealing)
* Provide parser output
* Render the document using `aglio`
* Login with Apiary account to use some features on the IDE directly
* Provide autocomplete (if I type `+ Request [` I want to see Http verbs, or in payloads I want to recall MSON structures)
* Select the best parser (shipped drafterjs or local drafterjs/protagonist)
* Use Codelens feature to provide MSON references and Dredd test status for endpoint

The parsing is provided by [drafter.js](https://github.com/apiaryio/drafter.js).

### Found a Bug?
Please file any issues at https://github.com/XVincentX/vscode-apielements.

### Development

First install:
* Node.js (newer than 4.3.1)
* Npm (newer 2.14.12)

This extension is built on top Visual Studio template; so:

To **run and develop** do the following:

* For both `server` and `client` directory (in the exact order):

* Run `npm i`
* Open in Visual Studio Code (`code .`)
* Press F5 to debug
