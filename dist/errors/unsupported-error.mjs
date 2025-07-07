export class UnsupportedError extends Error {
    constructor(...args) {
        super(...args);
        this.name = 'UnsupportedError';
        this.code = 500;
        Error.captureStackTrace(this, UnsupportedError);
    }
}
//# sourceMappingURL=unsupported-error.js.map