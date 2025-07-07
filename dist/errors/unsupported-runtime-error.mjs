export class UnsupportedRuntimeError extends Error {
    constructor(...args) {
        super(...args);
        this.name = 'UnsupportedRuntimeError';
        this.code = 500;
        Error.captureStackTrace(this, UnsupportedRuntimeError);
    }
}
//# sourceMappingURL=unsupported-runtime-error.js.map