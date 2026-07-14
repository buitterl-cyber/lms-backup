import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { SocialAuthService } from "./social.service";

const WEB = () => process.env.WEB_URL || "https://lms.excisone.com";

/** Public social sign-in endpoints (TenantMiddleware lets /auth/* through). The callback sets
 *  the same riyada_token cookie the password login stores, then lands the browser in the app. */
@ApiTags("auth")
@Controller("auth/social")
export class SocialAuthController {
  constructor(private readonly social: SocialAuthService) {}

  @Get("providers")
  providers() {
    return this.social.enabledProviders();
  }

  @Get(":provider")
  start(@Param("provider") provider: string, @Query("redirect") redirect: string | undefined, @Res() res: Response) {
    res.redirect(this.social.authorizeRedirect(provider, redirect || "/learner"));
  }

  @Get(":provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() res: Response,
  ) {
    return this.finish(provider, code, state, error, res);
  }

  /** Apple posts the callback (response_mode=form_post); everyone else GETs it. */
  @Post(":provider/callback")
  async callbackPost(
    @Param("provider") provider: string,
    @Body() body: { code?: string; state?: string; error?: string },
    @Res() res: Response,
  ) {
    return this.finish(provider, body.code, body.state, body.error, res);
  }

  private async finish(provider: string, code?: string, state?: string, error?: string, res?: Response) {
    if (error || !code || !state) {
      return res!.redirect(`${WEB()}/login?error=${encodeURIComponent(error || "social_cancelled")}`);
    }
    try {
      const { token, redirectPath } = await this.social.handleCallback(provider, code, state);
      // Same cookie contract as the password login page (client-readable; 12h like the JWT).
      res!.cookie("riyada_token", token, {
        path: "/",
        maxAge: 12 * 3600_000,
        sameSite: "lax",
        secure: true,
      });
      return res!.redirect(`${WEB()}${redirectPath}`);
    } catch (e) {
      const code = (e as { code?: string }).code || "social_failed";
      return res!.redirect(`${WEB()}/login?error=${encodeURIComponent(code)}`);
    }
  }
}
