import { Module } from "@nestjs/common";
import { ForumsController } from "./forums.controller";
import { ForumsService } from "./forums.service";
import { PeerReviewService } from "./peer-review.service";

@Module({ controllers: [ForumsController], providers: [ForumsService, PeerReviewService], exports: [PeerReviewService] })
export class ForumsModule {}
