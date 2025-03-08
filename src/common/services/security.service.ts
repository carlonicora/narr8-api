import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserRole } from "src/common/enums/UserRole";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

export const checkPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

@Injectable()
export class SecurityService {
  constructor(private readonly jwtService: JwtService) {}

  get refreshTokenExpiration(): Date {
    return new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  get tokenExpiration(): Date {
    return new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  }

  signJwt(params: { userId: string; roles: string[]; companyId: string; features: string[] }): string {
    return this.jwtService.sign({
      userId: params.userId,
      roles: params.roles.map((role) => role),
      companyId: params.companyId,
      features: params.features,
      expiration: this.tokenExpiration,
    });
  }

  validateAdmin(params: { user: any }): void {
    if (
      !this.isUserInRoles({
        user: params.user,
        roles: [UserRole.Administrator],
      })
    )
      throw new Error("User is not an admin");
  }

  isUserInRoles(params: { user: any; roles: UserRole[] }): boolean {
    if (!params.user || !params.user.roles) return false;
    return params.roles.some((role: UserRole) => params.user.roles.includes(role));
  }
}
