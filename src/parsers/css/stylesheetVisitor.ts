import * as vscode from 'vscode';

//#region vscode-css-languageservice types
//vscode-css-languageservice doesn't export types for stylesheet structure, 
//copied used stuff here with change from Node -> StylesheetNode to not collide with other imports
//https://github.com/microsoft/vscode-css-languageservice/blob/6fc97981cd91acda33af479e73bf6f726768baba/src/parser/cssNodes.ts
const simpleSelector = 5;
const classSelector = 14;
const identifierSelector = 15;
const declaration = 19;
const declarations = 20;
const stringLiteral = 27;
const uriLiteral = 28;
const importNode = 54;
const mediaQuery = 59;

export type StylesheetNode = {
    parent: StylesheetNode | null;
    offset: number;
    length: number;
    end: number;
    type: number;
    getText(): string;
    children: StylesheetNode[] | undefined;
    accept(visitor: (node: StylesheetNode) => boolean): void
    acceptVisitor(visitor: { visitNode: (node: StylesheetNode) => boolean }): void
};
//#endregion

export type NodeData = {
    text: string,
    location: vscode.Location,
    type: 'import' | 'selector'
};

export class StylesheetVisitor {

    constructor(
        private doc: vscode.TextDocument,
        private callback: (selector: NodeData) => void,
    ) {
    }

    visitNode(node: StylesheetNode): boolean {
        const type = node.type;
        switch (type) {
            case classSelector:
                this.callback({
                    text: node.getText(),
                    location: this.getLocation(node),
                    type: 'selector'
                });
                return false;
            case identifierSelector:
                this.callback({
                    text: node.getText(),
                    location: this.getLocation(node),
                    type: 'selector'
                });
                return false;
            case importNode:
                const name = this.getImportName(node);
                if (name != null && name !== '') {
                    this.callback({
                        location: this.getLocation(node),
                        text: name.substring(1, name.length - 1),
                        type: 'import'
                    });
                }
                return false;
            //todo skip whole declarations, regular could be skipped but media rules declarations should stay
            case declarations:
                break;
            case declaration:
            case mediaQuery:
                return false;
            default:
                break;
        }
        return true;
    }

    private getImportName(node: StylesheetNode) {
        let name = '';
        node.accept(x => {
            try {
                if (x.type === stringLiteral) {
                    name = x.getText();
                    return false;
                }
                if (x.type === uriLiteral) {
                    if (x.children != null) {
                        name = x.children[0].getText();
                    }
                    return false;
                }
                return true;
            }
            catch {
                return true;
            }
        });
        return name;
    }

    private getLocation(node: StylesheetNode) {
        const range = new vscode.Range(this.doc.positionAt(node.offset), this.doc.positionAt(node.end));
        const location = new vscode.Location(this.doc.uri, range);
        return location;
    }
}