import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

export class TempDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private static scheme = '1d94e4ae-6028-4eac-9200-744e8b397abb';
    private static files = new Map<string, string>();
    private constructor() { }

    public static register() {
        vscode.workspace.registerTextDocumentContentProvider(TempDocumentContentProvider.scheme, new TempDocumentContentProvider());
    }

    public static async getDocument(content: string) {
        var uuid = uuidv4();
        this.files.set(uuid, content);

        const uri = vscode.Uri.parse(TempDocumentContentProvider.scheme + ':' + uuid);
        const doc = await vscode.workspace.openTextDocument(uri);
        return [doc, uuid] as const;
    }

    public static async freeDocument(uuid: string){
        TempDocumentContentProvider.files.delete(uuid);
    }

    onDidChange?: vscode.Event<vscode.Uri> | undefined;

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const uuid = uri.path;
        return TempDocumentContentProvider.files.get(uuid);
    }


}