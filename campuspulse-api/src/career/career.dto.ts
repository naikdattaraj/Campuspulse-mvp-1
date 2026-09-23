import { IsObject } from "class-validator";

export class SubmitCareerDto {
  /** { [questionId]: selectedOptionIndex } */
  @IsObject()
  answers: Record<string, number>;
}
