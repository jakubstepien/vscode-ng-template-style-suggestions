# Angular templates style suggestions
## Features
This extension provides intelisense for classes and ids in angular templates. Supports SASS, SCSS, LESS and CSS.

### Classes from component style
![Component scoped css classes](https://github.com/jakubstepien/vscode-ng-template-style-suggestions/blob/master/images/local-css.gif)

Note: Suggestions in html file templates rely on matching filenames. So extension won't work if component's ts file is in a different directory than the template.

### Classes from global styles
![Global css classes](https://github.com/jakubstepien/vscode-ng-template-style-suggestions/blob/master/images/global-css.gif)

The extension tracks files specified in styles array of default project in angular.json file. These suggestions are cached until one of the files changes or angular.json changes.

Global scss file can import other files and suggestions will include them but only main style files from angular.json are tracked. To detect changes from files cache must be reset, see commands and configuration.

## Commands

>Angular Sass Suggestions: Reset cache

Commands that resets cached global styles

## Configuration

>Angular json path pattern

File pattern used to locate angular.json, default is `**/*angular.json`

>Project

Name of the project from angular.json to get global styles from, if empty uses value of 'defaultProject' from angular.json

>Extra File Watchers

List of file patterns to monitor for changes in addition to those from angular.json. Any change in them will global class reset cache.
Example pattern:
`**/styles/variables.scss`

>Ignore paths for suggestions

List of regexes to filter file paths used for suggestions, if matches all classes and ids from the file will be ignored.

>Cache active editor suggestions

Caches suggestions until currently edited file changes. Default is true

>Global styles suggestions

Show classes and ids from globally defined styles. Default is true

## Requirements

* Single Angular.json file (Angular 6+) in project
* Angular Language Service for support in inline templates 




