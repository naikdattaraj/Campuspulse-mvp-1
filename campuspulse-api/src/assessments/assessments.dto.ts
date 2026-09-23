import { IsInt, IsObject, Min } from "class-validator";

export class SubmitAssessmentDto {
  /** { [questionId]: selectedOptionIndex } */
  @IsObject()
  answers: Record<string, number>;

  @IsInt() @Min(0)
  timeTakenSeconds: number;
}
