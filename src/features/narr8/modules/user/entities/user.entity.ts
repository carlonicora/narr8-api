import { Entity, mapEntity } from "src/common/abstracts/entity";
import { EntityFactory } from "src/common/factories/entity.factory";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";

export type User = Entity & {
  discord: string;
  name: string;
};

export const mapUser = (params: { data: any; record: any; entityFactory: EntityFactory }): User => {
  return {
    ...mapEntity({ record: params.data }),
    discord: params.data.discord,
    name: params.data.name,
  };
};

export const UserModel: DataModelInterface<User> = {
  endpoint: "users",
  nodeName: "user",
  entity: undefined as unknown as User,
  mapper: mapUser,
};
