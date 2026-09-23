import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AssessmentsModule } from "./assessments/assessments.module";
import { AuthModule } from "./auth/auth.module";
import { CareerModule } from "./career/career.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { EventsModule } from "./events/events.module";
import { PollsModule } from "./polls/polls.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    PollsModule,
    EventsModule,
    AssessmentsModule,
    CareerModule,
    DashboardModule,
  ],
})
export class AppModule {}
