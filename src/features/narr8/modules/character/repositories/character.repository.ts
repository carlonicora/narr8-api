import { Injectable } from "@nestjs/common";
import { Proficiencies } from "src/common/enums/proficiencies";
import { Neo4jService } from "src/common/services/neo4j.service";
import { Character, CharacterModel } from "../entities/character.entity";

@Injectable()
export class CharacterRepository {
  constructor(private readonly neo4j: Neo4jService) {}

  async findCharacterByDiscord(params: { discord: string; userId: string }): Promise<Character> {
    const query = this.neo4j.initQuery({ serialiser: CharacterModel });

    query.queryParams = {
      ...query.queryParams,
      discord: params.discord,
      userId: params.userId,
    };

    query.query += `
      MATCH (server:Server {discord:$discord})
      MATCH (user:User {id: $userId})
      MATCH (server)<-[:PLAYS_IN]-(character:Character)-[:OWNED_BY]->(user)

      MATCH (character)-[character_proficiency:HAS_ATTRIBUTE]->(character_attribute:Attribute)
      MATCH (character)-[:OWNED_BY]->(character_user:User)
      RETURN character, character_proficiency, character_attribute, character_user
    `;

    return this.neo4j.readOne(query);
  }

  async findOne(params: { characterId: string }): Promise<Character> {
    const query = this.neo4j.initQuery({ serialiser: CharacterModel });

    query.queryParams = {
      ...query.queryParams,
      characterId: params.characterId,
    };

    query.query += `
      MATCH (character:Character {id: $characterId})
      MATCH (character)-[character_proficiency:HAS_ATTRIBUTE]->(character_attribute:Attribute)
      MATCH (character)-[:OWNED_BY]->(character_user:User)
      RETURN character, character_proficiency, character_attribute, character_user
    `;

    return this.neo4j.readOne(query);
  }

  async create(params: { characterId: string; discord: string; name: string; userId: string }): Promise<Character> {
    const query = this.neo4j.initQuery({ serialiser: CharacterModel });

    query.queryParams = {
      ...query.queryParams,
      characterId: params.characterId,
      discord: params.discord,
      name: params.name,
      userId: params.userId,
    };

    query.query += `
      MATCH (server:Server {discord:$discord})
      MATCH (user:User {id: $userId})
      MERGE (character:Character {id: $characterId})
      ON CREATE SET
        character.name = $name, 
        character.createdAt = datetime(), 
        character.updatedAt = datetime()
      CREATE (server)<-[:PLAYS_IN]-(character)-[:OWNED_BY]->(user)
      WITH character
      MATCH (attribute:Attribute)
      CREATE (character)-[:HAS_ATTRIBUTE {proficiency: "${Proficiencies.Unskilled}"}]->(attribute)
      WITH character
      MATCH (character)-[character_proficiency:HAS_ATTRIBUTE]->(character_attribute:Attribute)
      MATCH (character)-[:OWNED_BY]->(character_user:User)
      RETURN character, character_proficiency, character_attribute, character_user
    `;

    return this.neo4j.writeOne(query);
  }

  async patch(params: {
    characterId: string;
    avatar?: string;
    strength?: string;
    agility?: string;
    awareness?: string;
    intellect?: string;
    willpower?: string;
    empathy?: string;
    occult?: string;
    charisma?: string;
    name?: string;
  }): Promise<Character> {
    const query = this.neo4j.initQuery({ serialiser: CharacterModel });

    query.queryParams = {
      ...query.queryParams,
      characterId: params.characterId,
      avatar: params.avatar,
      strength: params.strength,
      agility: params.agility,
      awareness: params.awareness,
      intellect: params.intellect,
      willpower: params.willpower,
      empathy: params.empathy,
      occult: params.occult,
      charisma: params.charisma,
      name: params.name,
    };

    const sets = [];
    if (params.avatar) sets.push(", character.avatar = $avatar");
    if (params.name) sets.push(", character.name = $name");

    query.query += `
      MATCH (character:Character {id: $characterId})
      SET character.updatedAt = datetime()
      ${sets.join("")}
      WITH character
    `;

    if (params.strength) {
      query.query += `
        MATCH (character)-[p_strength:HAS_ATTRIBUTE]->(attr_strength:Attribute {name: "Strength"})
        SET p_strength.proficiency = $strength
        WITH character
      `;
    }
    if (params.agility) {
      query.query += `
        MATCH (character)-[p_agility:HAS_ATTRIBUTE]->(attr_agility:Attribute {name: "Agility"})
        SET p_agility.proficiency = $agility
        WITH character
      `;
    }
    if (params.awareness) {
      query.query += `
        MATCH (character)-[p_awareness:HAS_ATTRIBUTE]->(attr_awareness:Attribute {name: "Awareness"})
        SET p_awareness.proficiency = $awareness
        WITH character
      `;
    }
    if (params.intellect) {
      query.query += `
        MATCH (character)-[p_intellect:HAS_ATTRIBUTE]->(attr_intellect:Attribute {name: "Intellect"})
        SET p_intellect.proficiency = $intellect
        WITH character
      `;
    }
    if (params.willpower) {
      query.query += `
        MATCH (character)-[p_willpower:HAS_ATTRIBUTE]->(attr_willpower:Attribute {name: "Willpower"})
        SET p_willpower.proficiency = $willpower
        WITH character
      `;
    }
    if (params.empathy) {
      query.query += `
        MATCH (character)-[p_empathy:HAS_ATTRIBUTE]->(attr_empathy:Attribute {name: "Empathy"})
        SET p_empathy.proficiency = $empathy
        WITH character
      `;
    }
    if (params.occult) {
      query.query += `
        MATCH (character)-[p_occult:HAS_ATTRIBUTE]->(attr_occult:Attribute {name: "Occult"})
        SET p_occult.proficiency = $occult
        WITH character
      `;
    }
    if (params.charisma) {
      query.query += `
        MATCH (character)-[p_charisma:HAS_ATTRIBUTE]->(attr_charisma:Attribute {name: "Charisma"})
        SET p_charisma.proficiency = $charisma
        WITH character
      `;
    }

    query.query += `
      MATCH (character)-[character_proficiency:HAS_ATTRIBUTE]->(character_attribute:Attribute)
      MATCH (character)-[:OWNED_BY]->(character_user:User)
      RETURN character, character_proficiency, character_attribute, character_user
    `;

    return this.neo4j.writeOne(query);
  }
}
