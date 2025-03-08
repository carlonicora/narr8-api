import { HttpException, HttpStatus } from "@nestjs/common";
import * as qs from "qs";
import { JsonApiBuilderInterface } from "../interfaces/JsonApiBuilderInterface";
import { JsonApiDataInterface } from "../interfaces/JsonApiDataInterface";

export interface JsonApiPaginationInterface {
  size?: number;
  // before?: string;
  // after?: string;
  // idName?: string;
  offsetPrevious?: number;
  offsetNext?: number;
  offset?: number;
}

export interface JsonApiCursorInterface {
  cursor?: number;
  take?: number;
}

export interface JsonApiRelationshipBuilderInterface {
  type: string;
  id: string;
}

type IncludedFields = {
  type: string;
  fields: string[];
};

export class JsonApiBuilder {
  private _paginationCount = 25;
  private _pagination: JsonApiPaginationInterface = {};
  private _additionalParams: string = "";

  private _includedType: string[] = [];
  private _includedFields: IncludedFields[] = [];

  constructor(query?: any) {
    if (!query) return;

    const parsedQuery = qs.parse(query);

    if (parsedQuery?.include) {
      parsedQuery.include.split(",").forEach((type: string) => {
        this._includedType.push(type);
      });
    }
    if (parsedQuery?.fields) {
      Object.entries(parsedQuery.fields).forEach(([key, value]: [string, unknown]) => {
        this._includedFields.push({ type: key, fields: (value as string).split(",") });
      });
    }

    if (parsedQuery.page?.size) this._pagination.size = +parsedQuery.page.size;
    if (parsedQuery.page?.offset) this._pagination.offset = +parsedQuery.page.offset;

    this._additionalParams = Object.keys(query)
      .filter((key) => key !== "page[size]" && key !== "page[before]" && key !== "page[after]")
      .map((key) => `${key}=${query[key]}`)
      .join("&");

    if (this._additionalParams.length > 0) this._additionalParams = "&" + this._additionalParams;
  }

  private get size(): number {
    return (this._pagination?.size ?? this._paginationCount) + 1;
  }

  async buildSingle(builder: JsonApiBuilderInterface, record: any): Promise<any> {
    if (!record) throw new HttpException(`not found`, HttpStatus.NOT_FOUND);

    if (typeof record[`${builder.id}`] === "string")
      return await this.serialise(
        record,
        builder.create(),
        `${process.env.API_URL}${builder.endpoint}/${record[`${builder.id}`]}`,
      );

    return await this.serialise(
      record,
      builder.create(),
      `${process.env.API_URL}${builder.endpoint}/${record[`${builder.id}`]}`,
    );
  }

  async buildList(builder: JsonApiBuilderInterface, records: any[]): Promise<any> {
    return await this.serialise(
      records,
      builder.create(),
      `${process.env.API_URL}${builder.endpoint}${builder.endpointParameters}`,
    );
  }

  generateCursor(): JsonApiCursorInterface {
    const cursor: JsonApiCursorInterface = {
      cursor: this._pagination.offset,
      take: this.size,
    };

    return cursor;
  }

  private updatePagination(data: any[]): void {
    const hasEnoughData = data.length === this.size;

    if (hasEnoughData) this._pagination.offsetNext = (this._pagination.offset ?? 0) + data.length - 1;
    if (this._pagination.offset) this._pagination.offsetPrevious = this._pagination.offset - this.size;
  }

  private _addToIncluded(includedElements: any[], newElements: any[]) {
    const uniqueIdentifiers = new Set(includedElements.map((e) => `${e.type}-${e.id}`));

    newElements.forEach((element) => {
      if (this._includedType.length > 0 && !this._includedType.includes(element.type)) return;
      const identifier = `${element.type}-${element.id}`;

      if (!uniqueIdentifiers.has(identifier)) {
        includedElements.push(element);
        uniqueIdentifiers.add(identifier);
      }
    });
  }

  async serialise<T, R extends JsonApiDataInterface>(
    data: T | T[],
    builder: R,
    url?: string,
  ): Promise<JsonApiDataInterface> {
    const response: any = {
      links: {
        self: url,
      },
      data: undefined,
    };

    if (Array.isArray(data) && data.length <= this.size) {
      if (url) {
        if (!this._pagination) {
          this._pagination = { size: this._paginationCount };
        }
        this.updatePagination(data);
        if (!this._pagination.size) this._pagination.size = this._paginationCount;

        if (data.length === this.size) {
          // Build self link: update or add page[size] and remove page[offset] if present.
          const urlSelf = new URL(url);
          urlSelf.searchParams.set("page[size]", this._pagination.size.toString());
          urlSelf.searchParams.delete("page[offset]");
          response.links.self = urlSelf.toString().replace(/%5B/g, "[").replace(/%5D/g, "]");

          if (this._pagination.offsetNext) {
            // Build next link: update or add both page[size] and page[offset].
            const urlNext = new URL(url);
            urlNext.searchParams.set("page[size]", this._pagination.size.toString());
            urlNext.searchParams.set("page[offset]", this._pagination.offsetNext.toString());
            response.links.next = urlNext.toString().replace(/%5B/g, "[").replace(/%5D/g, "]");
          }

          data.splice(this._pagination.size, 1);
        }

        if (this._pagination.offsetPrevious) {
          // Build previous link: update or add both page[size] and page[offset].
          const urlPrev = new URL(url);
          urlPrev.searchParams.set("page[size]", this._pagination.size.toString());
          urlPrev.searchParams.set("page[offset]", this._pagination.offset.toString());
          response.links.prev = urlPrev.toString().replace(/%5B/g, "[").replace(/%5D/g, "]");
        }
      } else {
        delete response.links;
      }
    }

    const included: any[] = [];

    if (Array.isArray(data)) {
      const serialisedResults = await Promise.all(data.map((item: T) => this.serialiseData(item, builder)));

      response.data = serialisedResults.map((result) => result.serialisedData);

      this._addToIncluded(
        included,
        ([] as any[]).concat(...serialisedResults.map((result) => result.includedElements)),
      );
    } else {
      const { serialisedData, includedElements } = await this.serialiseData(data, builder);
      response.data = serialisedData;
      this._addToIncluded(included, includedElements);
    }

    if (included.length > 0) response.included = included;

    return response;
  }

  private async serialiseData<T, R extends JsonApiDataInterface>(
    data: T,
    builder: R,
  ): Promise<{
    serialisedData: any | any[];
    includedElements: any[];
  }> {
    const includedElements: any[] = [];
    const serialisedData: any = {
      type: builder.type,
    };

    if (typeof builder.id === "function") {
      serialisedData.id = builder.id(data);
    } else {
      serialisedData.id = data[builder.id];
    }

    if (builder.links) {
      serialisedData.links = {
        self: builder.links.self(data),
      };
    }

    serialisedData.attributes = {};

    for (const attribute of Object.keys(builder.attributes)) {
      const includedField = this._includedFields.find(
        (includedField: IncludedFields) => includedField.type === builder.type,
      );
      if (!includedField || (includedField && includedField.fields.includes(attribute))) {
        if (typeof builder.attributes[attribute] === "function") {
          serialisedData.attributes[attribute] = await builder.attributes[attribute](data);
        } else {
          serialisedData.attributes[attribute] = data[attribute];
        }
      }
    }

    if (builder.meta) {
      serialisedData.meta = {};
      for (const meta of Object.keys(builder.meta)) {
        if (typeof builder.meta[meta] === "function") {
          serialisedData.meta[meta] = await builder.meta[meta](data);
        } else {
          serialisedData.meta[meta] = data[meta];
        }
      }
    }

    if (builder.relationships) {
      serialisedData.relationships = {};

      for (const [key, relationship] of Object.entries(builder.relationships)) {
        let resourceLinkage: any = {};
        const manyToManyRelationships = key.split("__");

        if (relationship.resourceIdentifier) {
          const minimalData: any = {
            type: relationship.resourceIdentifier.type,
          };

          try {
            if (typeof relationship.resourceIdentifier.id === "function") {
              minimalData.id = relationship.resourceIdentifier.id(data);
            } else {
              minimalData.id = data[relationship.resourceIdentifier.id];
            }

            resourceLinkage = {
              data: minimalData,
            };
            if (relationship.links) {
              resourceLinkage.links = {
                related: relationship.links.related(data),
              };
            }

            serialisedData.relationships[relationship.name ?? key] = resourceLinkage;
          } catch (e) {
            console.error(e);
            // Handle the error if needed
          }
        } else if (data[key]) {
          const { minimalData, relationshipLink, additionalIncludeds } = await this.serialiseRelationship(
            data[key],
            await relationship.data.create(),
          );

          resourceLinkage = relationship.forceSingle === true ? { data: minimalData[0] } : { data: minimalData };

          if (relationshipLink) {
            resourceLinkage.links = relationshipLink;
          } else if (relationship.links) {
            resourceLinkage.links = {
              related: relationship.links.related(data),
            };
          }

          if (!relationship.excluded && additionalIncludeds.length > 0) includedElements.push(...additionalIncludeds);

          serialisedData.relationships[relationship.name ?? key] = resourceLinkage;
        } else if (
          manyToManyRelationships.length > 1 &&
          data[manyToManyRelationships[0]] !== undefined &&
          data[manyToManyRelationships[0]].length > 0
        ) {
          serialisedData.relationships[relationship.name ?? key] = { data: [] };
          for (const item of data[manyToManyRelationships[0]]) {
            const { minimalData, additionalIncludeds } = await this.serialiseRelationship(
              item[manyToManyRelationships[1]],
              await relationship.data.create(),
            );

            if (!relationship.excluded && additionalIncludeds.length > 0) includedElements.push(...additionalIncludeds);

            if (relationship.forceSingle === true) {
              serialisedData.relationships[relationship.name ?? key] = {
                data: minimalData,
              };
            } else {
              serialisedData.relationships[relationship.name ?? key].data.push(minimalData);
            }
          }
        } else if (relationship.links) {
          const related = relationship.links.related(data);

          if (related) {
            resourceLinkage.links = {
              related: related,
            };
            serialisedData.relationships[relationship.name ?? key] = resourceLinkage;
          }
        }
      }

      if (Object.keys(serialisedData.relationships).length === 0) delete serialisedData.relationships;
    }

    return {
      serialisedData: serialisedData,
      includedElements: includedElements,
    };
  }

  private async serialiseRelationship<T, R extends JsonApiDataInterface>(
    data: T | T[],
    builder: R,
  ): Promise<{
    minimalData: any | any[];
    relationshipLink: any;
    additionalIncludeds: any[];
  }> {
    const response = {
      minimalData: undefined,
      relationshipLink: undefined,
      additionalIncludeds: [],
    };

    if (Array.isArray(data)) {
      // Use Promise.all to handle async operations within map
      const serialisedResults = await Promise.all(data.map((item: T) => this.serialiseData(item, builder)));

      const serialisedData = serialisedResults.map((result) => result.serialisedData);

      const includedElements = serialisedResults.map((result) => result.includedElements).flat();

      response.minimalData = serialisedData.map((result) => {
        return { type: result.type, id: result.id };
      });

      this._addToIncluded(response.additionalIncludeds, includedElements.concat(serialisedData));
    } else {
      const { serialisedData, includedElements } = await this.serialiseData(data, builder);

      response.minimalData = {
        type: serialisedData.type,
        id: serialisedData.id,
      };

      if (serialisedData.links) {
        response.relationshipLink = {
          self: serialisedData.links.self,
        };
      }

      this._addToIncluded(response.additionalIncludeds, [...includedElements, serialisedData]);
    }

    return response;
  }
}
