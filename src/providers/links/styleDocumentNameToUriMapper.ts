import path = require("path");
import { FileType, TextDocument, Uri, workspace } from "vscode";
import { isNotNull, StyleSyntax } from "../../utils/common";
import { angularConfigProvider } from "../angularConfigProvider";

export interface StyleFileUris {
    mainUri?: Uri;
    globalMatchingUris: Uri[]
}

export async function getUris(linkName: string, sourceDocument: TextDocument): Promise<StyleFileUris> {
    try {
        linkName = normalizeFileName(linkName, sourceDocument);
        if (linkName.startsWith('/')) {
            //absolute uris will be handled by vscode
            return { globalMatchingUris: [] };
        }
        else {
            //normally relative vscode would handle relative uris but if extension adds a link default ones are skipped
            //so both need to be handled here
            const globalUris = getGlobalUris(linkName);
            const relativeUri = await getRelativeUris(linkName, sourceDocument);
            const globalFiltered = (await Promise.all(globalUris)).filter(isNotNull).filter(x => x.path !== relativeUri?.path);
            return {
                mainUri: relativeUri,
                globalMatchingUris: globalFiltered,
            };
        }
    }
    catch (ex) {
        console.error("Failed to get links for " + linkName);
        return {
            globalMatchingUris: [],
        };
    }
}

function getAbsoluteUris(fileName: string) {
    if (workspace.workspaceFolders != null) {
        return workspace.workspaceFolders.map(x => getUriIfExists(x.uri.toString(), fileName));
    }
    return [];
}

function getRelativeUris(fileName: string, sourceDocument: TextDocument) {
    const dir = path.dirname(sourceDocument.uri.path);
    return getUriIfExists(dir, fileName);
}

export function getGlobalUris(fileName: string) {
    return angularConfigProvider.configSnapshot!.includePaths.map(x => getUriIfExists(x, fileName));
}

async function getUriIfExists(filePath: string, fileName: string) {
    const fullPath = path.join(filePath, fileName);
    const uri = Uri.file(fullPath);
    try {
        const stat = await workspace.fs.stat(uri);
        return stat.type === FileType.Unknown ? undefined : uri;
    }
    catch {
        return undefined;
    }
}

function normalizeFileName(fileName: string, sourceDocument: TextDocument): string {
    return fileName.endsWith(sourceDocument.languageId) || fileName.endsWith(StyleSyntax.css)
        ? fileName
        : fileName + '.' + sourceDocument.languageId;
}

