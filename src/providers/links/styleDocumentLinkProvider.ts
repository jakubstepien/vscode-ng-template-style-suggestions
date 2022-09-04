
import path = require('path');
import { DocumentLink, Position, ProviderResult, TextDocument, Range, Uri, workspace, FileType } from 'vscode';
import { isNotNull, StyleSyntax } from '../../utils/common';
import { getLanguageServiceByLanguageType, mapDocumentToLangServiceDocument } from '../../utils/languageServiceUtils';
import { angularConfigProvider } from '../angularConfigProvider';
import { getUris } from './styleDocumentNameToUriMapper';


class StyleDocumentLinkProvider {
    enabled: boolean = false;

    async getLinks(document: TextDocument): Promise<DocumentLink[]> {
        if(this.canProcess(document) === false){
            return [];
        }

        const links = await this.getLinksFromLanguageService(document);
        return links;
    }

    private canProcess(document: TextDocument){
        if (this.enabled === false) {
            return false;
        }
        if (angularConfigProvider.configSnapshot == null) {
            return false;
        }
        if (document.languageId !== angularConfigProvider.configSnapshot.syntax) {
            return false;
        }
        if (angularConfigProvider?.configSnapshot?.includePaths == null) {
            return false;
        }
        return true;
    }

    private async getLinksFromLanguageService(document: TextDocument): Promise<DocumentLink[]> {
        const langService = getLanguageServiceByLanguageType(document.languageId);
        if (langService == null) {
            return [];
        }

        const langServiceDoc = mapDocumentToLangServiceDocument(document);
        const styleSheet = langService.parseStylesheet(langServiceDoc);
        const links = langService.findDocumentLinks(langServiceDoc, styleSheet, {
            resolveReference: (ref: string, baseUrl: string) => undefined
        });
        const documentLinks$ = links.filter(x => x.target != null).map(async link => {
            try {
                const range = new Range(
                    new Position(link.range.start.line, link.range.start.character),
                    new Position(link.range.end.line, link.range.end.character),
                );
                const fileUris = await getUris(link.target!, document);
                let mappedLinks: DocumentLink[] = [];
                if (fileUris.mainUri != null) {
                    mappedLinks.push(this.mapToDocumentLink(range, fileUris.mainUri, false));
                }
                mappedLinks = mappedLinks.concat(fileUris.globalMatchingUris.map(x => this.mapToDocumentLink(range, x, true)));
                return mappedLinks;
            }
            catch {
                return [];
            }
        });
        const documentLinks = await Promise.all(documentLinks$);
        return documentLinks.flatMap(x => x);
    }

    mapToDocumentLink(range: Range, x: Uri, isGlobalUri: boolean): DocumentLink {
        const link = new DocumentLink(range, x);
        if (isGlobalUri) {
            link.tooltip = "Follow link (angular global style)";
        }
        return link;
    }

    dispose() {
    }
}
export const styleDocumentLinkProvider = new StyleDocumentLinkProvider();