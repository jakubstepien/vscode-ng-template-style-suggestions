# Change Log
## 1.1.2 - 2022.09.11
- Fixed determining style language using inlineStyleLanguage instead of @schematics/angular:component.style from angular.json
- Changed to use first available project if default is not set
## 1.1.1 - 2022.09.04
- Fix for DocumentLinkProvider sometimes not working when first opened file in workspace is not a stylesheet
## 1.1.0 - 2022.09.04
- Added optional (disabled by default) document link provider for @import links in stylesheets. It will try to resolve relative urls using angular's 'stylePreprocessorOptions.includePaths' when possible.
## 1.0.0 - 2022.04.25
- Initial release