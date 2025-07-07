export class TreeSizeLimitError extends Error {
    constructor() {
        super('Tree size exceeds the allowed limit.');
        this.code = 422;
        this.name = 'TreeSizeLimitError';
        Error.captureStackTrace(this, TreeSizeLimitError);
    }
}
//# sourceMappingURL=tree-size-limit-error.js.map