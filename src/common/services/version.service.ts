import { Injectable } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

@Injectable()
export class VersionService {
  getVersion(): string {
    try {
      const packageJsonPath = join(process.cwd(), "package.json");
      const packageJsonContent = readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);
      return packageJson.version;
    } catch (error) {
      console.error("Error reading package.json:", error);
      return "unknown";
    }
  }
}
