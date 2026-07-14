import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SocialAuthController } from "./social.controller";
import { SocialAuthService } from "./social.service";

@Module({ controllers: [AuthController, SocialAuthController], providers: [AuthService, SocialAuthService] })
export class AuthModule {}
