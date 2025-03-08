import { ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ClsService } from "nestjs-cls";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly cls: ClsService,
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      return true;
    }

    return super.canActivate(context) as boolean;
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) return null;

    if (err || !user) {
      if (info?.message === "jwt expired") {
        throw new HttpException("Token expired", 401);
      } else if (err) {
        throw err;
      }
      return null;
    }

    this.cls.set("userId", user.userId);
    this.cls.set("companyId", user.companyId ?? request.headers["x-companyid"]);

    return user;
  }
}
