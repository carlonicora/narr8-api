import { Injectable } from "@nestjs/common";
import { Neo4jService } from "src/common/services/neo4j.service";
import { User, UserModel } from "../entities/user.entity";

@Injectable()
export class UserRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async findUserByDiscord(params: { discord: string }): Promise<User> {
    const query = this.neo4j.initQuery({ serialiser: UserModel });

    query.queryParams = {
      ...query.queryParams,
      discord: params.discord,
    };

    query.query += `
      MATCH (user:User {discord:$discord})
      RETURN user
    `;

    return this.neo4j.readOne(query);
  }

  async create(params: { id: string; discord: string; name: string }): Promise<User> {
    const query = this.neo4j.initQuery({ serialiser: UserModel });

    query.queryParams = {
      ...query.queryParams,
      id: params.id,
      discord: params.discord,
      name: params.name,
    };

    query.query += `
      MERGE (user:User {id:$id})
      ON CREATE SET 
        user.discord = $discord, 
        user.name = $name,
        user.createdAt = datetime(), 
        user.updatedAt = datetime()
      RETURN user
    `;

    return this.neo4j.writeOne(query);
  }
}
