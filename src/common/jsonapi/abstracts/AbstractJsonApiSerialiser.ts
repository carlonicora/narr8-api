import { JsonApiBuilderInterface } from "src/common/jsonapi/interfaces/JsonApiBuilderInterface";
import { JsonApiDataInterface } from "src/common/jsonapi/interfaces/JsonApiDataInterface";

export abstract class AbstractJsonApiSerialiser implements JsonApiBuilderInterface {
  private _id: string;
  private _attributes: any = {};

  private _meta: any = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    recordCount: "recordCount",
  };

  private _links: any = {
    self: (data: any) => {
      return `${process.env.API_URL}${this.endpoint}/${data[this.id]}`;
    },
  };

  private _relationships: any = {};

  constructor() {
    this._id = "id";
  }

  abstract get type(): string;

  get id(): string {
    return this._id;
  }

  get endpoint(): string {
    return this.type;
  }

  get endpointParameters(): string {
    return "";
  }

  set attributes(attributes: any) {
    this._attributes = attributes;
  }

  set meta(meta: any) {
    this._meta = {
      ...this._meta,
      ...meta,
    };
  }

  set links(links: any) {
    this._links = links;
  }

  set relationships(relationships: any) {
    this._relationships = relationships;
  }

  create(): JsonApiDataInterface {
    return {
      type: this.type,
      id: (data: any) => {
        return data[this.id];
      },
      attributes: this._attributes,
      meta: this._meta,
      relationships: this._relationships,
      links: this._links,
    };
  }
}
