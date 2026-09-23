import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from "../auth/auth.guards";
import { CreateEventDto } from "./events.dto";
import { EventsService } from "./events.service";

@Controller("events")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.events.list(u.id);
  }

  @Get(":id")
  get(@CurrentUser() u: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.events.get(u.id, id);
  }

  @Post(":id/register")
  @Roles("student")
  register(@CurrentUser() u: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.events.register(u.id, id);
  }

  @Post()
  @Roles("admin")
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateEventDto) {
    return this.events.create(u.id, dto);
  }
}
