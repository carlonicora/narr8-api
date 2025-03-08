import { AbstractJsonApiSerialiser } from "src/common/jsonapi/abstracts/AbstractJsonApiSerialiser";
import { JsonApiBuilderInterface } from "src/common/jsonapi/interfaces/JsonApiBuilderInterface";

export function getEndpoint(modelGetter: () => DataModelInterface<any>): string {
  return modelGetter().endpoint;
}

export type SerialiserType = AbstractJsonApiSerialiser & JsonApiBuilderInterface;

export type DataModelInterface<T> = {
  endpoint: string;
  nodeName: string;
  entity: T;
  mapper: (params: { data: any; record: any; entityFactory: any; name?: string }) => T;
  serialiser?: new (...args: any[]) => SerialiserType;
  childrenTokens?: string[];
  singleChildrenTokens?: string[];
};
