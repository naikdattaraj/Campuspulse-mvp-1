import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from "../auth/auth.guards";
import { CreatePollDto, VoteDto } from "./polls.dto";
import { PollsService } from "./polls.service";

@Controller("polls")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PollsController {
  constructor(private polls: PollsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.polls.list(u.id);
  }

  @Post(":id/vote")
  @Roles("student")
  vote(@CurrentUser() u: AuthUser, @Param("id", ParseUUIDPipe) id: string, @Body() dto: VoteDto) {
    return this.polls.vote(u.id, id, dto.optionId);
  }

  @Post()
  @Roles("admin")
  create(@CurrentUser() u: AuthUser, @Body() dto: CreatePollDto) {
    return this.polls.create(u.id, dto);
  }
}
