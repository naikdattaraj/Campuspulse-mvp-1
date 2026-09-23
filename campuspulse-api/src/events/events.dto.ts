import { IsDateString, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CreateEventDto {
  @IsString() @MinLength(3, { message: "Enter the event title." })
  title: string;

  @IsDateString({}, { message: "Choose the event date." })
  date: string;

  @Matches(/^\d{2}:\d{2}$/, { message: "Enter the time as HH:MM." })
  time: string;

  @IsString() @MinLength(2, { message: "Enter the event location." })
  location: string;

  @IsOptional() @IsString()
  description?: string;
}
