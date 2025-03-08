import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";
import { UserRole } from "src/common/enums/UserRole";

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard("jwt") implements CanActivate {
  constructor(
    private readonly cls: ClsService,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) return false;

    return super.canActivate(context) as boolean;
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) throw new HttpException("Unauthorised", 401);

    if (err || !user) {
      if (info?.message === "jwt expired") {
        throw new HttpException("Token expired", 401);
      } else if (err) {
        throw err;
      }
      return null;
    }

    this._validateRoles(user, context);

    this.cls.set("userId", user.userId);
    this.cls.set("companyId", user.companyId ?? request.headers["x-companyid"]);

    return user;
  }

  private _validateRoles(user: any, context: any): void {
    const requiredRoles: string[] = this.reflector.get<string[]>("roles", context.getHandler()) ?? [];

    if (!requiredRoles.includes(UserRole.Administrator)) requiredRoles.push(UserRole.Administrator);

    if (!requiredRoles.some((role) => user.roles.includes(role))) throw new HttpException("Unauthorised", 401);
  }
}
