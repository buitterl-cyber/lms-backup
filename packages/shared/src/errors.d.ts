/** Domain errors mapped to RFC-7807 problem+json by the API exception filter. */
export declare class DomainError extends Error {
    readonly status: number;
    readonly code: string;
    readonly detail?: unknown | undefined;
    constructor(message: string, status?: number, code?: string, detail?: unknown | undefined);
}
export declare class NotFoundError extends DomainError {
    constructor(entity: string, id?: string);
}
export declare class ForbiddenError extends DomainError {
    constructor(permission?: string);
}
export declare class ConflictError extends DomainError {
    constructor(message: string);
}
export declare class ValidationError extends DomainError {
    constructor(message: string, detail?: unknown);
}
