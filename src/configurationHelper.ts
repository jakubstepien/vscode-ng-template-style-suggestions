import * as vscode from 'vscode';
import { activeDocumentStyleProvider } from './providers/activeDocumentStyleProvider';
import { angularConfigProvider } from './providers/angular-config-provider';
import { globalCssProvider } from './providers/global-css-provider';

const extensionString = 'angularSassSuggestions';
const resetCacheCommand = 'resetCache';
const projectConfigurationName = 'project';
const extraWatchersConfigurationName = 'extraFileWatchers';
const ignorePathsForSuggestions = 'ignorePathsForSuggestions';
const cacheActiveEditorSuggestions = 'cacheActiveEditorSuggestions';

class Command<TArg> {
    constructor(private command: string, private callback: (arg: TArg) => any, thisArg?: any) {
    }

    public invoke(arg: TArg) {
        vscode.commands.executeCommand(this.command, arg);
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
        globalCssProvider.init();
        activeDocumentStyleProvider.init(config.get(cacheActiveEditorSuggestions) as boolean);
    })
};

export function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(commands.resetCache.register());
}

export function registerConfigurationChangeEvents(content: vscode.ExtensionContext) {
    const resetIfAffected = (e: vscode.ConfigurationChangeEvent, option: string, callback: () => void) => {
        const affected = e.affectsConfiguration(option);
        if (affected) {
            callback();
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

    const configurationWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        resetIfAffected(e, `${extensionString}.${projectConfigurationName}`, () => {
            commands.resetCache.invoke();
        });
        resetIfAffected(e, `${extensionString}.${ignorePathsForSuggestions}`, () => {
            commands.resetCache.invoke();
        });
        resetIfAffected(e, `${extensionString}.${cacheActiveEditorSuggestions}`, () => {
            commands.resetCache.invoke();
        });

        resetIfAffected(e, `${extensionString}.${extraWatchersConfigurationName}`, () => {
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

type RegexFlag = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'y';
interface PathRegex {
    regex: string,
    flags: RegexFlag[];
}

export function getPathsToIgnore(): RegExp[] {
    const configPaths = vscode.workspace.getConfiguration(extensionString).get(ignorePathsForSuggestions) as PathRegex[];
    const regexes: RegExp[] = [];
    for (const config of configPaths) {
        const regex = new RegExp(config.regex, config.flags.join());
        regexes.push(regex);
    }
    return regexes;
}