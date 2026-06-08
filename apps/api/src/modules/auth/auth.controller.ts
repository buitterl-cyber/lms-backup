import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { IsString } from "class-validator";
import { ApiTags } from "@nestjs/swagger";
import { DomainError } from "@riyada/shared";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsString() email!: string;
  @IsString() password!: string;
}

// Public (no tenant context). TenantMiddleware skips /api/v1/auth/*.
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get("me")
  me(@Headers("authorization") authz?: string) {
    const token = authz?.replace(/^Bearer\s+/i, "");
    if (!token) throw new DomainError("No token", 401, "unauthorized");
    return this.auth.me(token);
  }
}
