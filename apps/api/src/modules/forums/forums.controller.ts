import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PermissionsGuard } from "../../common/rbac/permissions.guard";
import { RequirePermissions } from "../../common/rbac/permissions.decorator";
import { ForumsService } from "./forums.service";
import { PeerReviewService } from "./peer-review.service";

@ApiTags("forums")
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller()
export class ForumsController {
  constructor(
    private readonly forums: ForumsService,
    private readonly peerReviews: PeerReviewService,
  ) {}

  @Get("forums/:courseId/threads")
  @RequirePermissions("catalog:read")
  list(@Param("courseId") courseId: string, @Query("filter") filter?: string) {
    return this.forums.listThreads(courseId, filter);
  }

  @Get("forums/:courseId/stats")
  @RequirePermissions("catalog:read")
  stats(@Param("courseId") courseId: string) {
    return this.forums.stats(courseId);
  }

  @Post("forums/:courseId/threads")
  @RequirePermissions("ai:use")
  create(@Param("courseId") courseId: string, @Body() body: { title: string; body: string; anonymous?: boolean }) {
    return this.forums.createThread(courseId, body);
  }

  @Get("forums/threads/:id")
  @RequirePermissions("catalog:read")
  thread(@Param("id") id: string) {
    return this.forums.getThread(id);
  }

  @Post("forums/threads/:id/replies")
  @RequirePermissions("ai:use")
  reply(@Param("id") id: string, @Body() body: { body: string; anonymous?: boolean }) {
    return this.forums.reply(id, body);
  }

  @Post("forums/threads/:id/vote")
  @RequirePermissions("ai:use")
  voteThread(@Param("id") id: string) {
    return this.forums.vote({ threadId: id });
  }

  @Post("forums/replies/:id/vote")
  @RequirePermissions("ai:use")
  voteReply(@Param("id") id: string) {
    return this.forums.vote({ replyId: id });
  }

  @Post("forums/threads/:id/pin")
  @RequirePermissions("catalog:manage")
  pin(@Param("id") id: string, @Body() body: { pinned?: boolean }) {
    return this.forums.pin(id, body.pinned ?? true);
  }

  @Post("forums/threads/:id/accept/:replyId")
  @RequirePermissions("catalog:manage")
  accept(@Param("id") id: string, @Param("replyId") replyId: string) {
    return this.forums.accept(id, replyId);
  }

  @Post("courses/:id/review")
  @RequirePermissions("ai:use")
  rate(@Param("id") courseId: string, @Body() body: { rating: number; comment?: string; anonymous?: boolean }) {
    return this.forums.rateCourse(courseId, body);
  }

  // --- Peer reviews ---

  @Post("peer-reviews")
  @RequirePermissions("ai:use")
  submit(@Body() body: { courseId?: string; title: string; content: string }) {
    return this.peerReviews.submit(body);
  }

  @Get("peer-reviews")
  @RequirePermissions("catalog:read")
  queue(@Query("status") status?: string) {
    return this.peerReviews.queue(status || "pending");
  }

  @Post("peer-reviews/:id/review")
  @RequirePermissions("catalog:manage")
  review(@Param("id") id: string, @Body() body: { feedback: string; score?: number }) {
    return this.peerReviews.review(id, body);
  }
}
