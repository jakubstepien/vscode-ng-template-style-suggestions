import { SuggestionType } from "../common";

const regex = /(\[?(?:(?:class)|(?:ngClass)|(?:id))\]?)="([^"]*)$/i;

export function getInputtingSymbol(text: string) : SuggestionType | null {
    const matches = text.match(regex);
    if (matches == null) {
        return null;
    }

    const attribute = matches[1];
    const isExpression = attribute.startsWith('[');
    
    const type: SuggestionType = attribute.toLowerCase().indexOf('id') !== -1
        ? 'id'
        : 'class';
    //if it isn't expression value will be regular string so show all suggestions
    if (isExpression === false) {
        return type;
    }

    const value = matches[2];
    let isInString = false;
    for (const char of value) {
        if(char === '\'') {
            isInString = !isInString;
        }
    }
    return isInString ? type : null;
}