import { IsEmail, IsIn, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString() @MinLength(2, { message: "Enter your full name." })
  name: string;

  @IsEmail({}, { message: "Enter a valid college email." })
  email: string;

  @IsString() @MinLength(8, { message: "Use at least 8 characters, including a number." })
  @Matches(/\d/, { message: "Use at least 8 characters, including a number." })
  password: string;

  @IsIn(["student", "admin"])
  role: "student" | "admin";
}

export class LoginDto {
  @IsEmail({}, { message: "Enter a valid college email." })
  email: string;

  @IsString() @MinLength(1)
  password: string;

  @IsIn(["student", "admin"])
  role: "student" | "admin";
}
