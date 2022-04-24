import * as vscode from 'vscode';
import { Observable, Subject, Subscription, switchMap, finalize, startWith, of, } from 'rxjs';
import { angularConfigProvider } from './angularConfigProvider';
import { StylesToCompletitionItemsParser } from '../parsers/stylesToCompletitionItemsParser';
import { getDefaultParsingResult, StyleSuggestionsByType } from '../common';
import { globalStyleSuggestionsEnabled } from '../configurationHelper';

class GlobalStylesProvider {
    private static sortingPrefix: string = 'style2:';
    private subs = new Subscription();
    private mainStylesUris$: Observable<string[]> = of([]);
    private items: Promise<StyleSuggestionsByType> = Promise.resolve(getDefaultParsingResult());

    public async init() {
        this.subs?.unsubscribe();
        this.subs = new Subscription();

        if (globalStyleSuggestionsEnabled()) {
            this.mainStylesUris$ = angularConfigProvider.config$.pipe(
                switchMap(x => {
                    if (x == null) {
                        return of([]);
                    }
                    const files = x.stylesUrls;
                    const subject = new Subject<string[]>();
                    const watchers = files.map(x => vscode.workspace.createFileSystemWatcher('**/' + x));
                    watchers.forEach(x => {
                        x.onDidChange(() => {
                            subject.next(files);
                        });
                    });
                    const disposeWatchers = () => {
                        watchers.forEach(w => w.dispose());
                    };
                    return subject.pipe(startWith(files), finalize(disposeWatchers));
                }));
    
            this.subs.add(this.mainStylesUris$.subscribe(x => {
                this.items = this.initItems(x);
            }));
        }
        else {
            this.items = Promise.resolve(getDefaultParsingResult());
        }
    }

    getGlobalCompletitionItems() { return this.items; }

    private async initItems(stylePaths: string[]): Promise<StyleSuggestionsByType> {
        try {
            var parser = new StylesToCompletitionItemsParser();
            const items = await parser.getCompletitionItemsFromFile(stylePaths);
            items.class.forEach(x => x.sortText = GlobalStylesProvider.sortingPrefix + x.label);
            items.id.forEach(x => x.sortText = GlobalStylesProvider.sortingPrefix + x.label);
            return items;
        }
        catch (e) {
            console.error("Error parsing items: ", e);
            return getDefaultParsingResult();
        }
    }

    dispose() {
        this.subs.unsubscribe();
    }
}

export const globalStylesProvider = new GlobalStylesProvider();