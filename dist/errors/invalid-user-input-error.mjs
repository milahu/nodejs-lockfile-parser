export class InvalidUserInputError extends Error {
    constructor(...args) {
        super(...args);
        this.code = 422;
        this.name = 'InvalidUserInputError';
        Error.captureStackTrace(this, InvalidUserInputError);
    }
}
//# sourceMappingURL=invalid-user-input-error.js.map