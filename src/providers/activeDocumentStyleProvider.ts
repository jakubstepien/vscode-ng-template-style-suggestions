import * as vscode from 'vscode';
import { LocalStylesProvider } from './localStylesProvider';
import { globalStylesProvider } from './globalStylesProvider';
import { addMaps, extractCompletitionItemsFromGrouped, isDocumentInlineTemplate, joinSuggestions, SuggestionType } from '../common';
import { Subject } from 'rxjs';

class ActiveDocumentStyleProvider {
    private items: Promise<vscode.CompletionItem[]> | null = null;
    private onDestroy = new Subject<void>();
    private cacheEnabled = true;

    init(cacheEnabled: boolean) {
        this.dispose();
        this.onDestroy = new Subject<void>();

        this.cacheEnabled = cacheEnabled;
        this.items = null;

        const handler = vscode.window.onDidChangeActiveTextEditor((e) => {
            this.items = null;
        });
        this.onDestroy.subscribe(x => handler.dispose());
    }

    async getCompletitionItems(document: vscode.TextDocument, position: vscode.Position, type: SuggestionType) {
        //if its inline template I cannot cache whole results because position could have changed to different decorator -> component
        if (isDocumentInlineTemplate(document)) {
            this.items = null;
        }

        if (this.items == null || this.cacheEnabled === false) {
            this.items = new Promise(async res => {
                const globalCompletitionItems = await globalStylesProvider.getGlobalCompletitionItems();
                const localCompletitionItems = await new LocalStylesProvider(document, position).getCompletitionItems();

                const combinedResults = joinSuggestions(localCompletitionItems, globalCompletitionItems, false);
                res(extractCompletitionItemsFromGrouped(combinedResults, type));
            });

        }
        return await this.items;
    }

    dispose() {
        this.onDestroy.next();
        this.onDestroy.complete();
    }
}

export const activeDocumentStyleProvider = new ActiveDocumentStyleProvider();