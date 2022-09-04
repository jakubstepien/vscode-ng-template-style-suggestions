import { filter, finalize, Subject, Subscription, take, tap } from 'rxjs';
import * as vscode from 'vscode';
import { TempDocumentContentProvider } from './documentContentProviders/tempDocumentContentProvider';
import { angularConfigProvider } from './providers/angularConfigProvider';
import { styleDocumentLinkProvider } from './providers/links/styleDocumentLinkProvider';
import { StyleSyntax } from './utils/common';
import { getUseAngularIncludePathsInStyleSheetNavigationLinks } from './utils/configuration/configurationHelper';

class StyleLinkProviderManager {
    private _reset = new Subject<void>();
    private _provider: vscode.Disposable | null = null;
    private _subscription?: Subscription;

    public init(context: vscode.ExtensionContext) {
        context.subscriptions.push(this);
        this._subscription = angularConfigProvider.config$
            .pipe(
                filter(x => x?.syntax != null),
                finalize(() => this.disposeProvider())
            )
            .subscribe(config => this.setLinkProvider(config!.syntax));
        this._subscription.add(this._reset.subscribe(x => {
            const syntax = angularConfigProvider.configSnapshot?.syntax;
            this.setLinkProvider(syntax);
        }));

        this.prepareForFirstRun(context);
    }

    private prepareForFirstRun(context: vscode.ExtensionContext){
        const preheatSub = angularConfigProvider.config$
            .pipe(
                filter(x => x?.syntax != null), 
                take(1)
            )
            .subscribe(async x => {
                //workaround for bug in vscode where DocumentLinkProvider links are ignored depending on default opened file (last opened in previous session)
                //if default is one covered by provider links will work normally
                //if its some other type links from provider will be ignored until it's registered again
                
                //workaround with resetting provider on active editor changes works but first file will still have wrong links
                //running provider at the start for a temp file and then resetting on first window change seems to work every time
                const syntax = x?.syntax!;
                this.setLinkProvider(syntax);
                await TempDocumentContentProvider.useTempDocument("@include 'internal-extension-init'\n", async (doc) => {
                    await vscode.languages.setTextDocumentLanguage(doc, syntax);
                    const links = await vscode.commands.executeCommand('vscode.executeLinkProvider', doc.uri);
                });
                const activeEditor = vscode.window.onDidChangeActiveTextEditor((e) => {
                    if(e?.document.languageId === syntax){
                        this.setLinkProvider(syntax);
                        activeEditor.dispose();
                    }
                });
                context.subscriptions.push(activeEditor);
            });
        this._subscription?.add(preheatSub);
    }

    private setLinkProvider(style?: StyleSyntax) {
        this.disposeProvider();
        styleDocumentLinkProvider.enabled = getUseAngularIncludePathsInStyleSheetNavigationLinks();
        if (styleDocumentLinkProvider.enabled && style != null) {
            this._provider = vscode.languages.registerDocumentLinkProvider(style, {
                provideDocumentLinks: async (document: vscode.TextDocument, token: vscode.CancellationToken) => {
                    const links = await styleDocumentLinkProvider.getLinks(document);
                    return links;
                }
            });
        }
        else {
            this._provider = null;
        }
    };

    reset() {
        this._reset.next();
    }

    private disposeProvider() {
        this._provider?.dispose();
    }

    dispose() {
        this._subscription?.unsubscribe();
    }
}
export const styleLinkProviderManager = new StyleLinkProviderManager();