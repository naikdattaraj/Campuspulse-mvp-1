import {
  CanActivate, createParamDecorator, ExecutionContext, ForbiddenException,
  Injectable, SetMetadata, UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

export type AuthUser = { id: string; role: "student" | "admin"; name: string; email: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    
    const [type, token] = (req.headers.authorization ?? "").split(" ");
    if (type !== "Bearer" || !token) throw new UnauthorizedException("Log in to continue.");
    try {
      const p = await this.jwt.verifyAsync(token);
      req.user = { id: p.sub, role: p.role, name: p.name, email: p.email } as AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException("Your session has expired. Log in again.");
    }
  }
}

export const Roles = (...roles: AuthUser["role"][]) => SetMetadata("roles", roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>("roles", [ctx.getHandler(), ctx.getClass()]);
    if (!roles || roles.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException("Only admins can do this.");
    return true;
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
