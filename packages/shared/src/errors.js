"use strict";
/** Domain errors mapped to RFC-7807 problem+json by the API exception filter. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConflictError = exports.ForbiddenError = exports.NotFoundError = exports.DomainError = void 0;
class DomainError extends Error {
    status;
    code;
    detail;
    constructor(message, status = 400, code = "domain_error", detail) {
        super(message);
        this.status = status;
        this.code = code;
        this.detail = detail;
        this.name = new.target.name;
    }
}
exports.DomainError = DomainError;
class NotFoundError extends DomainError {
    constructor(entity, id) {
        super(`${entity}${id ? ` ${id}` : ""} not found`, 404, "not_found");
    }
}
exports.NotFoundError = NotFoundError;
class ForbiddenError extends DomainError {
    constructor(permission) {
        super(permission ? `Missing permission: ${permission}` : "Forbidden", 403, "forbidden");
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends DomainError {
    constructor(message) {
        super(message, 409, "conflict");
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends DomainError {
    constructor(message, detail) {
        super(message, 422, "validation_error", detail);
    }
}
exports.ValidationError = ValidationError;
