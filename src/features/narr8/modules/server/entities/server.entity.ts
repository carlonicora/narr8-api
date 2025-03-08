import { Entity, mapEntity } from "src/common/abstracts/entity";
import { EntityFactory } from "src/common/factories/entity.factory";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";

export type Server = Entity & {
  discord: string;
  name: string;
};

export const mapServer = (params: { data: any; record: any; entityFactory: EntityFactory }): Server => {
  return {
    ...mapEntity({ record: params.data }),
    discord: params.data.discord,
    name: params.data.name,
  };
};

export const ServerModel: DataModelInterface<Server> = {
  endpoint: "servers",
  nodeName: "server",
  entity: undefined as unknown as Server,
  mapper: mapServer,
};
