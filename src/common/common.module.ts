import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { VersionController } from "src/common/controllers/version.controller";
import { EntityFactory } from "src/common/factories/entity.factory";
import { SerialiserFactory } from "src/common/factories/serialiser.factory";
import { discordClientProvider } from "src/common/providers/discord.client.provider";
import { InitialiserRepository } from "src/common/repositories/initialiser.repository";
import { ErrorDiscordSerialiser } from "src/common/serialisers/error.discord.serialiser";
import { DiscordService } from "src/common/services/discord.service";
import { EmailService } from "src/common/services/email.service";
import { Neo4jService } from "src/common/services/neo4j.service";
import { PoolService } from "src/common/services/pool.service";
import { SecurityService } from "src/common/services/security.service";
import { VersionService } from "src/common/services/version.service";
import { JwtStrategy } from "src/common/strategies/jwt.strategy";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "24h" },
    }),
    PassportModule,
  ],
  controllers: [VersionController],
  providers: [
    discordClientProvider,
    VersionService,
    JwtStrategy,
    EmailService,
    DiscordService,
    EntityFactory,
    Neo4jService,
    PoolService,
    SecurityService,
    SerialiserFactory,
    InitialiserRepository,
    ErrorDiscordSerialiser,
  ],
  exports: [
    discordClientProvider,
    JwtModule,
    PassportModule,
    EmailService,
    EntityFactory,
    DiscordService,
    Neo4jService,
    PoolService,
    SecurityService,
    SerialiserFactory,
    ErrorDiscordSerialiser,
  ],
})
export class CommonModule {}
