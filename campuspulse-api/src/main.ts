import "reflect-metadata";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ValidationError } from "class-validator";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop unknown fields
      transform: true,
      // return one readable sentence so the UI can show it directly
      exceptionFactory: (errors: ValidationError[]) => {
        const first = errors[0];
        const msg = first?.constraints ? Object.values(first.constraints)[0] : "Check the form and try again.";
        return new BadRequestException(msg);
      },
    }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`CampusPulse API running on http://localhost:${port}`);
}
bootstrap();
