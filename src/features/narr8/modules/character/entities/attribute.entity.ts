import { Entity, mapEntity } from "src/common/abstracts/entity";
import { EntityFactory } from "src/common/factories/entity.factory";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";

export type Attribute = Entity & {
  name: string;
  proficiency: string;
};

export const mapAttribute = (params: { data: any; record: any; entityFactory: EntityFactory }): Attribute => {
  let proficiency: number | undefined;
  for (const key of params.record.keys) {
    if (key.endsWith("character_proficiency")) {
      const rel = params.record.get(key);
      if (rel?.type === "HAS_ATTRIBUTE" && rel?.properties?.proficiency != null) {
        proficiency = rel.properties.proficiency;
        break;
      }
    }
  }

  return {
    ...mapEntity({ record: params.data }),
    name: params.data.name,
    proficiency: proficiency ? proficiency.toString() : "Unskilled",
  };
};

export const AttributeModel: DataModelInterface<Attribute> = {
  endpoint: "attributes",
  nodeName: "attribute",
  entity: undefined as unknown as Attribute,
  mapper: mapAttribute,
};
