import * as sass from 'sass';
import { RawSourceMap } from 'source-map-js';
import { pathToFileURL } from 'url';
import { StyleSyntax } from '../utils/common';
import { getPathsToIgnore } from '../utils/configuration/configurationHelper';
import { angularConfigProvider } from '../providers/angularConfigProvider';
import { StyleCompilationResult, StyleCompiler } from './styleCompiler';

export class SassCompiler implements StyleCompiler {
    public async compileFile(path: string): Promise<StyleCompilationResult> {
        try {
            const result = sass.compile(path, SassCompiler.getSassOptions());
            return {
                css: result.css,
                path,
                sourceMap: result.sourceMap
            };
        }
        catch (e) {
            console.error(`Error compiling sass/scss ${path}: ${e}`);
            return {
                css: '',
                path,
            };
        }
    }

    public async compileString(content: string, syntax: StyleSyntax, path?: string): Promise<StyleCompilationResult> {
        try {
            const options: sass.StringOptions<'sync'> = SassCompiler.getSassOptions();
            if (syntax === 'less') {
                throw new Error('Invalid syntax');
            }
            options.syntax = syntax === StyleSyntax.sass ? 'indented' : syntax;
            const result = sass.compileString(content, options);
            return {
                css: result.css,
                path: path ?? '',
                sourceMap: result.sourceMap
            };
        }
        catch (e) {
            console.error("Error compiling sass/scss: " + e);
            return {
                css: '',
                path: path ?? '',
            };
        }
    }

    private static getSassOptions(): sass.Options<"sync"> {
        const nodePath = angularConfigProvider.configSnapshot?.nodeModulesLocation;
        const paths = Array.from(angularConfigProvider.configSnapshot?.includePaths ?? []);
        if (nodePath != null) {
            paths.push(nodePath);
        }

        const pathsToIgnore = getPathsToIgnore();
        return {
            loadPaths: paths,
            sourceMap: pathsToIgnore.length > 0,
            sourceMapIncludeSources: false,
            importers: [{
                //https://sass-lang.com/documentation/js-api/interfaces/FileImporter
                findFileUrl(url) {
                    if (!url.startsWith('~')) {
                        return null;
                    }
                    return new URL(url.substring(1), pathToFileURL(nodePath + '/'));
                },
            }],
        };
    }
}