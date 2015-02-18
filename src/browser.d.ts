
interface Node {
    contains( other: Node ): boolean;
}

interface XPathResult {
    iterateNext(): Node;
}

interface Document {
    evaluate (
        xpathExpression: string,
        contextNode: Node,
        namespaceResolver: any,
        resultType: number,
        result: XPathResult
    ): XPathResult;
}

