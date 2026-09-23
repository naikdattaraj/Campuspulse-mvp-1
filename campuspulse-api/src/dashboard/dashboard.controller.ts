import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from "../auth/auth.guards";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get("student")
  @Roles("student")
  student(@CurrentUser() u: AuthUser) {
    return this.svc.student(u.id);
  }

  @Get("admin")
  @Roles("admin")
  admin() {
    return this.svc.admin();
  }
}
