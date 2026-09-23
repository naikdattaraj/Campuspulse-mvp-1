import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from "../auth/auth.guards";
import { SubmitCareerDto } from "./career.dto";
import { CareerService } from "./career.service";

@Controller("career")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("student")
export class CareerController {
  constructor(private svc: CareerService) {}

  @Get("quiz")
  quiz() {
    return this.svc.quiz();
  }

  @Post("submit")
  submit(@CurrentUser() u: AuthUser, @Body() dto: SubmitCareerDto) {
    return this.svc.submit(u.id, dto.answers);
  }

  @Get("result")
  result(@CurrentUser() u: AuthUser) {
    return this.svc.latest(u.id);
  }
}
