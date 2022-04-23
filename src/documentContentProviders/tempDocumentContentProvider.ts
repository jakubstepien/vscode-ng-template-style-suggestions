import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export class TempDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private static scheme = '1d94e4ae-6028-4eac-9200-744e8b397abb';
    private static files = new Map<string, string>();
    private constructor() { }

    public static async useTempDocument(content: string, action: (doc: vscode.TextDocument) => Promise<void> | void){
        let uuid = '';
            try {
                const [doc, docUuid] = await TempDocumentContentProvider.getDocument(content);
                uuid = docUuid;
                await action(doc);
            }
            finally {
                TempDocumentContentProvider.freeDocument(uuid);
            }
    }

    public static register(context: vscode.ExtensionContext) {
        const provider = new TempDocumentContentProvider();
        const disposable = vscode.workspace.registerTextDocumentContentProvider(TempDocumentContentProvider.scheme, provider);
        
        context.subscriptions.push(disposable);
        context.subscriptions.push(provider);
    }

    private static async getDocument(content: string) {
        var uuid = uuidv4();
        this.files.set(uuid, content);

        const uri = vscode.Uri.parse(TempDocumentContentProvider.scheme + ':' + uuid);
        const doc = await vscode.workspace.openTextDocument(uri);
        return [doc, uuid] as const;
    }

    private static async freeDocument(uuid: string) {
        TempDocumentContentProvider.files.delete(uuid);
    }

    onDidChange?: vscode.Event<vscode.Uri> | undefined;

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const uuid = uri.path;
        return TempDocumentContentProvider.files.get(uuid);
    }

    dispose() {
        TempDocumentContentProvider.files.forEach(x => TempDocumentContentProvider.freeDocument(x));
    }
}