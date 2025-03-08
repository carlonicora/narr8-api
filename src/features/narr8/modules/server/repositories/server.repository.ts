import { Injectable } from "@nestjs/common";
import { Neo4jService } from "src/common/services/neo4j.service";
import { User } from "src/features/narr8/modules/user/entities/user.entity";
import { Server, ServerModel } from "../entities/server.entity";

@Injectable()
export class ServerRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async findServerByDiscord(params: { discord: string }): Promise<Server> {
    const query = this.neo4j.initQuery({ serialiser: ServerModel });

    query.queryParams = {
      ...query.queryParams,
      discord: params.discord,
    };

    query.query += `
      MATCH (server:Server {discord:$discord})
      RETURN server
    `;

    return this.neo4j.readOne(query);
  }

  async create(params: { serverId: string; discord: string; name: string; user: User }): Promise<Server> {
    const query = this.neo4j.initQuery({ serialiser: ServerModel });

    query.queryParams = {
      ...query.queryParams,
      serverId: params.serverId,
      discord: params.discord,
      name: params.name,
      userId: params.user.id,
    };

    query.query += `
      MERGE (server:Server {id: $serverId})
      ON CREATE SET
        server.discord = $discord,
        server.name = $name, 
        server.createdAt = datetime(), 
        server.updatedAt = datetime()
      WITH server
      MATCH (user:User {id: $userId})
      CREATE (server)-[:OWNED_BY]->(user)
      RETURN server
    `;

    return this.neo4j.writeOne(query);
  }
}
