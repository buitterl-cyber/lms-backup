import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { DomainError } from "@riyada/shared";
import { AuthService } from "./auth.service";

// Tight, IP-scoped limit for the endpoints brute-force/credential-stuffing actually targets —
// well below the module's generous 300/min default (see app.module.ts).
const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 8 } };

class LoginDto {
  @IsString() email!: string;
  @IsString() password!: string;
  @IsOptional() @IsIn(["learner", "admin"]) portal?: "learner" | "admin";
}

class ForgotDto {
  @IsString() email!: string;
}

class ResetDto {
  @IsString() token!: string;
  @IsString() password!: string;
}

class SignupDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsString() email!: string;
  @IsString() password!: string;
}

// Public (no tenant context). TenantMiddleware skips /api/v1/auth/*.
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle(AUTH_THROTTLE)
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password, dto.portal);
  }

  @Throttle(AUTH_THROTTLE)
  @Post("forgot")
  forgot(@Body() dto: ForgotDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Throttle(AUTH_THROTTLE)
  @Post("reset")
  reset(@Body() dto: ResetDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Throttle(AUTH_THROTTLE)
  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Get("me")
  me(@Headers("authorization") authz?: string) {
    const token = authz?.replace(/^Bearer\s+/i, "");
    if (!token) throw new DomainError("No token", 401, "unauthorized");
    return this.auth.me(token);
  }
}
