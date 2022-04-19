const regex = /(\[?(?:(?:class)|(?:ngClass))\]?)="([^"]*)$/;

export function isInputtingClass(text: string) {
    const matches = text.match(regex);
    if (matches == null) {
        return false;
    }

    const attribute = matches[1];
    const isExpression = attribute.startsWith('[');
    //if it isn't expression value will be regular string so show all suggestions
    if (isExpression === false) {
        return true;
    }

    const value = matches[2];
    let isInString = false;
    for (const char of value) {
        if(char === '\'') {
            isInString = !isInString;
        }
    }
    return isInString;
}