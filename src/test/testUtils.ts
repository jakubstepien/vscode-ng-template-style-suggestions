import * as vscode from 'vscode';
import { extensionString, globalStylesSuggestions, ignorePathsForSuggestions } from '../configurationHelper';

export async function resetConfiguration() {
    const opt = await vscode.workspace.getConfiguration(extensionString);
    await opt.update(globalStylesSuggestions, true);
    await opt.update(ignorePathsForSuggestions, []);
}