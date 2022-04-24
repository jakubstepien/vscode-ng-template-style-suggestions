import * as vscode from 'vscode';
import { activeDocumentStyleProvider } from './providers/activeDocumentStyleProvider';
import { angularConfigProvider } from './providers/angularConfigProvider';
import { globalStylesProvider } from './providers/globalStylesProvider';

export const extensionString = 'angularSassSuggestions';
export const resetCacheCommand = 'resetCache';
export const projectConfigurationName = 'project';
export const extraWatchersConfigurationName = 'extraFileWatchers';
export const ignorePathsForSuggestions = 'ignorePathsForSuggestions';
export const cacheActiveEditorSuggestions = 'cacheActiveEditorSuggestions';
export const globalStylesSuggestions = 'globalStylesSuggestions';

class Command<TArg> {
    constructor(private command: string, private callback: (arg: TArg) => any, thisArg?: any) {
    }

    public invoke(arg: TArg) {
        return vscode.commands.executeCommand(this.command, arg);
    }

    public register() {
        return vscode.commands.registerCommand(this.command, this.callback);
    }
}

export const commands = {
    resetCache: new Command<void>(`${extensionString}.${resetCacheCommand}`, async () => {
        const config = vscode.workspace.getConfiguration(extensionString);
        const projectName = config.get(projectConfigurationName) as string;

        await angularConfigProvider.init(projectName);
        await globalStylesProvider.init();
        activeDocumentStyleProvider.init(config.get(cacheActiveEditorSuggestions) as boolean);
    })
};

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(commands.resetCache.register());
}

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
            fileWatchers.forEach(x => x.onDidChange(() => commands.resetCache.invoke()));
        }
    };
    setupWatchers();

    const configurationWatcher = vscode.workspace.onDidChangeConfiguration(async e => {
        await resetIfAffected(e, `${extensionString}.${projectConfigurationName}`, async () => {
            await commands.resetCache.invoke();
        });
        await resetIfAffected(e, `${extensionString}.${ignorePathsForSuggestions}`, async () => {
            commands.resetCache.invoke();
        });
        await resetIfAffected(e, `${extensionString}.${cacheActiveEditorSuggestions}`, async () => {
            await commands.resetCache.invoke();
        });
        await resetIfAffected(e, `${extensionString}.${globalStylesSuggestions}`, async () => {
            await commands.resetCache.invoke();
        });

        await resetIfAffected(e, `${extensionString}.${extraWatchersConfigurationName}`, async () => {
            setupWatchers();
        });
    });
    content.subscriptions.push({
        dispose: () => {
            configurationWatcher?.dispose();
            cleanupWatchers();
        }
    });
}

export function globalStyleSuggestionsEnabled(): boolean {
    const setting = vscode.workspace.getConfiguration(extensionString).get(globalStylesSuggestions) as boolean | null;
    return setting ?? true;
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