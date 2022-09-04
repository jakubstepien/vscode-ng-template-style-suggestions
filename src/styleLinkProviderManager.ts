import { filter, finalize, Subject, Subscription } from 'rxjs';
import * as vscode from 'vscode';
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
                finalize(() => this._provider?.dispose())
            )
            .subscribe(config => this.setLinkProvider(config!.syntax));
        this._subscription.add(this._reset.subscribe(x => {
            const syntax = angularConfigProvider.configSnapshot?.syntax;
            this.setLinkProvider(syntax);
        }));
    }

    private setLinkProvider(style?: StyleSyntax) {
        this._provider?.dispose();
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

    dispose() {
        this._subscription?.unsubscribe();
    }
}
export const styleLinkProviderManager = new StyleLinkProviderManager();