import * as vscode from 'vscode';
import { styleLinkProviderManager } from '../../styleLinkProviderManager';
import { extensionCommands } from './commandsHelper';
import { extensionString, extraWatchersConfigurationName, projectConfigurationName, ignorePathsForSuggestions, cacheActiveEditorSuggestions, globalStylesSuggestions, angularJsonPathPattern, useAngularIncludePathsInStyleSheetNavigationLinks } from './constants';

export function registerConfigurationChangeEvents(content: vscode.ExtensionContext) {
    const resetIfAffected = async (e: vscode.ConfigurationChangeEvent, option: string, callback: () => void) => {
        const affected = e.affectsConfiguration(option);
        if (affected) {
            await callback();
        }
    };

    let fileWatchers: vscode.FileSystemWatcher[] = [];
    const cleanupWatchers = () => {
        fileWatchers.forEach(x => x.dispose());
        fileWatchers = [];
    };

    const setupWatchers = () => {
        const config = vscode.workspace.getConfiguration(extensionString);
        const watchers = config.get(extraWatchersConfigurationName) as string[];
        if (watchers != null && watchers.length > 0) {
            cleanupWatchers();
            fileWatchers = watchers.map(x => vscode.workspace.createFileSystemWatcher(x));
            fileWatchers.forEach(x => x.onDidChange(() => extensionCommands.resetCache.invoke()));
        }
    };
    setupWatchers();

    const configurationWatcher = vscode.workspace.onDidChangeConfiguration(async e => {
        const resetCacheOptions = [
            projectConfigurationName,
            ignorePathsForSuggestions,
            cacheActiveEditorSuggestions,
            globalStylesSuggestions,
            angularJsonPathPattern
        ];
        for (const option of resetCacheOptions) {
            await resetIfAffected(e, `${extensionString}.${option}`, async () => {
                await extensionCommands.resetCache.invoke();
            });
        }

        await resetIfAffected(e, `${extensionString}.${extraWatchersConfigurationName}`, async () => {
            setupWatchers();
        });

        await resetIfAffected(e, `${extensionString}.${useAngularIncludePathsInStyleSheetNavigationLinks}`, async () => {
            styleLinkProviderManager.reset();
        });
    });
    content.subscriptions.push({
        dispose: () => {
            configurationWatcher?.dispose();
            cleanupWatchers();
        }
    });
}

function getSetting<TValue>(key: string, defaultValue: TValue) {
    const setting = vscode.workspace.getConfiguration(extensionString).get(key) as TValue | null;
    return setting ?? defaultValue;
}

export function globalStyleSuggestionsEnabled(): boolean {
    return getSetting(globalStylesSuggestions, true);
}

export function getAngularJsonPathPattern(): string {
    return getSetting(angularJsonPathPattern, '**/*angular.json');
}

export function getUseAngularIncludePathsInStyleSheetNavigationLinks(): boolean {
    return getSetting(useAngularIncludePathsInStyleSheetNavigationLinks, false);
}

type RegexFlag = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'y';
interface PathRegex {
    regex: string,
    flags: RegexFlag[];
}
export function getPathsToIgnore(): RegExp[] {
    const configPaths = vscode.workspace.getConfiguration(extensionString).get(ignorePathsForSuggestions) as PathRegex[];
    if (configPaths == null) {
        return [];
    }

    const regexes: RegExp[] = [];
    for (const config of configPaths) {
        const regex = new RegExp(config.regex, config.flags.join());
        regexes.push(regex);
    }
    return regexes;
}