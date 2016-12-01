## [API Elements](http://api-elements.readthedocs.io/en/latest/) for [Visual Studio Code](https://code.visualstudio.com)

![Marketplace link](https://vsmarketplacebadge.apphb.com/version/vncz.vscode-apielements.svg)
![Installs](https://vsmarketplacebadge.apphb.com/installs/vncz.vscode-apielements.svg)
![Rating](https://vsmarketplacebadge.apphb.com/rating/vncz.vscode-apielements.svg)

Welcome to the API Elements extension for Visual Studio Code! This is a [totally untested](https://github.com/XVincentX/vscode-apielements/issues/8) extension which will improve your experience working with API description formats like [API Blueprint](https://apiblueprint.org) and [Swagger](https://swagger.io). It provides some great features, such as:

* Syntax highlight
* Parser error and warnings
* Useful snippets
* [Basic Apiary Integration](#basic-apiary-integration)
* Parser output
* [Basic symbol navigation (CMD + @)](#symbol-navigation)

![Basic Screenshot](./screenshot.png)

### What's API Elements about?

API Elements is the structure for parse results of both API Blueprint and Swagger, and it is built on the [Refract](https://github.com/refractproject/refract-spec#refract) format. It provides a single format for interacting with parse results from various API description formats. So far, only API Blueprint and Swagger are supported.

### Future development / ideas
* Render the document using `aglio` (this requires investigation as it's able to work just with API Blueprint)
* Provide autocomplete (if I type `+ Request [` I want to see Http verbs, or in payloads I want to recall MSON structures)
* Use Codelens feature to provide MSON references and Dredd test status for endpoint
* Integrate with other API tools (see [Dredd](https://github.com/apiaryio/dredd) or [drakov](https://github.com/Aconex/drakov))

### Found a Bug or - do you need a particular feature?
Please file an issue at https://github.com/XVincentX/vscode-apielements.

### Development

First install:
* Node.js (newer than 4.3.1)
* Npm (newer 2.14.12) - probably 3.x would be even better

This extension is built on top of Visual Studio template; so:

To **run and develop** do the following:

* For both `server` and `client` directory (in the exact order):

* Run `npm i`
* Open the server in Visual Studio Code (`code .`) and run the `build` task
* Open the client in Visual Studio Code (`code .`) and run the `launch` task
* Press F5 in the server to debug and use the extension in the VS Host instance.

_Note:_ If you're on a Unix envirnonment, you might want to use `open.sh` file which
will open both **client** and **server** instances at the same time.

### Testing the sources

Sometimes the master branch is not in sync with the latest published version (which is normal). If you want to test the latest change in your VSCode instance, just follow the following steps

1. `npm install -g vsce`
2. Clone the current repository and switch to the requested branch
3. Navigate to the `server` directory, then `npm install` and `npm run compile`
4. Navigate to the `client` directory, then `npm install` and `npm run compile` and `vsce package`
5. Drag and drop the generated `vsix` file into Visual Studio Code, which will load the extension.

## Notes

### Symbol navigation
Symbol navigation is strongly dependant on sourcemaps quality provided by the parser.
Currently, the following resources are indexed:

1. [API Title]()
2. [resource]()
3. [resourceGroup](http://api-elements.readthedocs.io/en/latest/element-definitions/#properties_6)
4. [transitions]()

The idea would be, of course, to improve symbol navigation as much as possible and exploit
sourcemaps in all their power. This, however, might take time. If you feel there are some
important symbols I'm missing, please file an issue, I'll be happy to evaluate it.

### Basic Apiary Integration
This extension is able to provide basic Apiary integration. Fundamentally, the entire
[Apiary client](https://github.com/apiaryio/apiary-client) has been reimplemented
following the [Apiary API documentation](http://docs.apiary.apiary.io). It means that
you can perform the following actions:

1. Fetch an API Description Document from your account
2. Publish an API Description Document to your account
3. Browse an API Description (navigating on Apiary.io hosted documentation)

without having to leave the editor at all.

Most of the process is actually automated. Thous, it will ask you to provide a
token and redirect you to the right page if it's not avaliable on your computer.
All those commands are listed with an `Apiary` prefix. Therefore, to see what you
can do, simply type `Apiary` in the command box to see what's going on.


#### Acknowledges
Even if I currently work for Apiary, this extension is my personal work and **it's not backed by Apiary.**
If you're enjoying the extension and would like to help, consider [a donation](https://paypal.me/vncz)

#### Dependencies status:
Client:
[![dependencies Status](https://david-dm.org/XVincentX/vscode-apielements/status.svg?path=server)](https://david-dm.org/XVincentX/vscode-apielements?path=server)

Server:
[![dependencies Status](https://david-dm.org/XVincentX/vscode-apielements/status.svg?path=client)](https://david-dm.org/XVincentX/vscode-apielements?path=server)
