import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";

export class CreatePollDto {
  @IsString() @MinLength(5, { message: "Enter the poll question (at least 5 characters)." })
  title: string;

  @IsArray() @ArrayMinSize(2, { message: "Add at least 2 options." }) @ArrayMaxSize(6, { message: "Use 6 options or fewer." })
  @IsString({ each: true }) @IsNotEmpty({ each: true, message: "Options cannot be empty." })
  options: string[];

  @IsDateString({}, { message: "Choose an expiration date." })
  expiresOn: string;
}

export class VoteDto {
  @IsUUID() optionId: string;
}
