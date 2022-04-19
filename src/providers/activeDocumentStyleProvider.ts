import * as vscode from 'vscode';
import { LocalCssProvider } from './local-css-provider';
import { globalCssProvider } from './global-css-provider';
import { addMaps, isDocumentInlineTemplate } from '../utils/common';
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

    async getCompletitionItems(document: vscode.TextDocument, position: vscode.Position) {
        //if its inline template I cannot cache whole results because position could have changed to different decorator -> component
        if (isDocumentInlineTemplate(document)) {
            this.items = null;
        }

        if (this.items == null || this.cacheEnabled === false) {
            this.items = new Promise(async res => {
                const globalCompletitionItems = await globalCssProvider.getGlobalCompletitionItems();
                const localCompletitionItems = await new LocalCssProvider(document, position).getCompletitionItems();

                const combinedMaps = addMaps(localCompletitionItems, globalCompletitionItems, true);
                const allItems = Array.from(combinedMaps).map(x => x[1]);
                res(allItems);
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