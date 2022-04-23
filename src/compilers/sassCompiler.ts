import * as sass from 'sass';
import { RawSourceMap } from 'source-map-js';
import { pathToFileURL } from 'url';
import { StyleSyntax } from '../common';
import { getPathsToIgnore } from '../configurationHelper';
import { angularConfigProvider } from '../providers/angularConfigProvider';

export type StyleCompilationResult = {
    css: string,
    path: string
    sourceMap?: RawSourceMap,
};

export class SassCompiler {
    public static compileFile(path: string): StyleCompilationResult {
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

    public static compileString(content: string, syntax: StyleSyntax, path?: string): StyleCompilationResult {
        try {
            const options: sass.StringOptions<'sync'> = SassCompiler.getSassOptions();
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
        const paths = angularConfigProvider.configSnapshot?.includePaths ?? [];
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