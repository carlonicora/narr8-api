import { Injectable, OnModuleInit } from "@nestjs/common";
import { attributes } from "src/common/enums/attributes";
import { UserRole } from "src/common/enums/UserRole";
import { Neo4jService } from "src/common/services/neo4j.service";

export enum Action {
  Read = "read",
  Create = "create",
  Update = "update",
  Delete = "delete",
}

@Injectable()
export class InitialiserRepository implements OnModuleInit {
  constructor(private readonly neo4j: Neo4jService) {}

  async onModuleInit() {
    await this.initialiseConstraints();
    await this.initialiseRoles();
    await this.initialiseUsers();
    await this.initialiseAttributes();
  }

  async initialiseConstraints() {
    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT user_id IF NOT EXISTS FOR (user:User) REQUIRE user.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT user_email IF NOT EXISTS FOR (user:User) REQUIRE user.email IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT character_id IF NOT EXISTS FOR (character:Character) REQUIRE character.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT attribute_id IF NOT EXISTS FOR (attribute:Attribute) REQUIRE attribute.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT role_id IF NOT EXISTS FOR (role:Role) REQUIRE role.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT server_id IF NOT EXISTS FOR (server:Server) REQUIRE server.id IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT server_discord IF NOT EXISTS FOR (server:Server) REQUIRE server.discord IS UNIQUE`,
    });

    await this.neo4j.writeOne({
      query: `CREATE CONSTRAINT attribute_id IF NOT EXISTS FOR (attribute:Attribute) REQUIRE attribute.id IS UNIQUE`,
    });
  }

  async initialiseRoles() {
    const query = `
        MERGE (role:Role {id: $roleId})
        ON CREATE SET role.name=$roleName, role.isSelectable=$isSelectable, role.createdAt = datetime(), role.updatedAt = datetime()
        ON MATCH SET role.name=$roleName, role.isSelectable=$isSelectable, role.createdAt = datetime(), role.updatedAt = datetime()
        RETURN role
      `;

    await this.neo4j.writeOne({
      query,
      queryParams: {
        roleId: UserRole.Administrator,
        roleName: "Administrators",
        isSelectable: false,
      },
    });
  }

  async initialiseUsers() {
    await this.neo4j.writeOne({
      query: `
        MERGE (u:User {id: $id})
        ON CREATE SET u.name = $name,
          u.email = $email,
          u.password = $password,
          u.isActive = $isActive,
          u.isDeleted = $isDeleted,
          u.createdAt = datetime(),
          u.updatedAt = datetime()
        WITH u
        MATCH (r:Role {id: $adminRoleId})
        MERGE (u)-[:MEMBER_OF]->(r)
      `,
      queryParams: {
        id: "a63553fb-5d3c-11ee-9dc3-0242ac120003",
        name: "Carlo Nicora",
        email: "carlo.nicora@gmail.com",
        password: "$2a$10$ZDt9V644BLOC.HTBDrzFlOcg5WWaHIFcDaoPhSVaiEA9xGyp0NtOq",
        isActive: true,
        isDeleted: false,
        adminRoleId: UserRole.Administrator,
      },
    });
  }

  async initialiseAttributes() {
    const query = `
      MERGE (attribute:Attribute {id: $id})
      ON CREATE SET 
        attribute.name=$name, 
        attribute.createdAt = datetime(), 
        attribute.updatedAt = datetime()
      RETURN attribute
    `;

    attributes.map(async (attribute: { id: string; name: string }) => {
      await this.neo4j.writeOne({
        query: query,
        queryParams: {
          id: attribute.id,
          name: attribute.name,
        },
      });
    });
  }
}
