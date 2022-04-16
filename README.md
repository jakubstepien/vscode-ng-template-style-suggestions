# Angular SCSS Classes Suggestions
## Features
This extension provides autocomplete for css classes in angular templates.

### Classes from component style
![Component scoped css classes](https://github.com/jakubstepien/vscode-angular-sass-suggestions/blob/master/doc/images/local-css.gif)

Note: Suggestions in html file templates rely on matching filenames. So extension won't work if for example foo.component.html file is in some other directory without matching foo.component.ts or fo.component.scss file.

### Classes from global styles
![Global css classes](https://github.com/jakubstepien/vscode-angular-sass-suggestions/blob/master/doc/images/global-css.gif)

Extension tracks files specified in styles array of default project in angular.json file. These suggestions are cached until one of the files changes or angular.json changes.

Global scss file can import other files and suggestions will include them but by default only main style files from angular.json are tracked. To see changes from those files cache must be reset, see commands and configuration.

## Commands

>Angular Sass Suggestions: Reset cache

Commands that resets cached global styles

## Configuration

>Angular Sass Suggestions Project

Name of the project from angular.json get global styles from, if empty uses value of 'defaultProject' from angular.json

>Angular Sass Suggestions Extra File Watchers

List of file patterns to monitor for changes in addition to those from angular.json. Any change in them will global class reset cache.
Example pattern:
`**/styles/variables.scss`

## Requirements

* Angular Language Service for support in inline templates 



