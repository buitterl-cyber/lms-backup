/** Domain errors mapped to RFC-7807 problem+json by the API exception filter. */

export class DomainError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly code: string = "domain_error",
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(`${entity}${id ? ` ${id}` : ""} not found`, 404, "not_found");
  }
}

export class ForbiddenError extends DomainError {
  constructor(permission?: string) {
    super(permission ? `Missing permission: ${permission}` : "Forbidden", 403, "forbidden");
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409, "conflict");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, detail?: unknown) {
    super(message, 422, "validation_error", detail);
  }
}
