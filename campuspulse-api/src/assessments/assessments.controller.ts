import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from "../auth/auth.guards";
import { SubmitAssessmentDto } from "./assessments.dto";
import { AssessmentsService } from "./assessments.service";

@Controller("assessments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("student")
export class AssessmentsController {
  constructor(private svc: AssessmentsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.svc.list(u.id);
  }

  @Get(":id/start")
  start(@Param("id") id: string) {
    return this.svc.start(id);
  }

  @Post(":id/submit")
  submit(@CurrentUser() u: AuthUser, @Param("id") id: string, @Body() dto: SubmitAssessmentDto) {
    return this.svc.submit(u.id, id, dto.answers, dto.timeTakenSeconds);
  }

  @Get(":id/result")
  result(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.svc.latestResult(u.id, id);
  }
}
