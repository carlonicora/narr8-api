import { Entity, mapEntity } from "src/common/abstracts/entity";
import { EntityFactory } from "src/common/factories/entity.factory";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";
import { Attribute } from "src/features/narr8/modules/attribute/entities/attribute.entity";
import { User } from "src/features/narr8/modules/user/entities/user.entity";

export type Character = Entity & {
  name: string;
  avatar?: string;

  user: User;
  attribute: Attribute[];
};

export const mapCharacter = (params: { data: any; record: any; entityFactory: EntityFactory }): Character => {
  return {
    ...mapEntity({ record: params.data }),
    name: params.data.name,
    avatar: params.data.avatar,
    user: undefined,
    attribute: [],
  };
};

export const CharacterModel: DataModelInterface<Character> = {
  endpoint: "characters",
  nodeName: "character",
  entity: undefined as unknown as Character,
  mapper: mapCharacter,
  childrenTokens: ["attribute"],
  singleChildrenTokens: ["user"],
};
