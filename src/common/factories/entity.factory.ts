// src/common/factories/entity.factory.ts
import { Injectable } from "@nestjs/common";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";
import { modelRegistry } from "src/common/registries/model/registry";

@Injectable()
export class EntityFactory {
  /**
   * Merges all rows in a single pass, building an object graph.
   * Single children become properties, children become arrays.
   */
  createGraphList<T extends DataModelInterface<any>>(params: { model: T; records: any[] }): ReturnType<T["mapper"]>[] {
    const nodeMap = new Map<string, any>();

    for (const [, record] of params.records.entries()) {
      this.createOrMerge({
        model: params.model,
        record,
        name: params.model.nodeName,
        nodeMap,
      });
    }

    // Return top-level nodes for the model
    const prefix = `${params.model.nodeName}#`;
    const finalResults: any[] = [];
    for (const [key, obj] of nodeMap.entries()) {
      if (key.startsWith(prefix)) {
        finalResults.push(obj);
      }
    }
    return finalResults;
  }

  private createOrMerge<T extends DataModelInterface<any>>(params: {
    model: T;
    record: any;
    name: string;
    nodeMap: Map<string, any>;
  }): ReturnType<T["mapper"]> | undefined {
    if (!params.record.has(params.name)) return undefined;

    const node = params.record.get(params.name);
    if (!node) return undefined;

    const nodeType = params.model.nodeName;
    const nodeId = node.properties?.id;
    if (!nodeId) return undefined;

    const mapKey = `${nodeType}#${nodeId}`;

    let entity = params.nodeMap.get(mapKey);
    if (!entity) {
      entity = params.model.mapper({
        data: node.properties,
        record: params.record,
        entityFactory: this,
        name: params.name,
      });
      params.nodeMap.set(mapKey, entity);
    }

    if (params.model.singleChildrenTokens) {
      for (const token of params.model.singleChildrenTokens) {
        const childModel = modelRegistry.get(token);
        if (!childModel) continue;

        const childName = `${params.name}_${childModel.nodeName}`;
        const childEntity = this.createOrMerge({
          model: childModel,
          record: params.record,
          name: childName,
          nodeMap: params.nodeMap,
        });
        if (childEntity) {
          entity[childModel.nodeName] = childEntity;
        }
      }
    }

    if (params.model.childrenTokens) {
      for (const token of params.model.childrenTokens) {
        const childModel = modelRegistry.get(token);
        if (!childModel) continue;

        const childName = `${params.name}_${childModel.nodeName}`;
        const childEntity = this.createOrMerge({
          model: childModel,
          record: params.record,
          name: childName,
          nodeMap: params.nodeMap,
        });
        if (childEntity) {
          if (!Array.isArray(entity[childModel.nodeName])) {
            entity[childModel.nodeName] = [];
          }
          // Ensure the same child isn't added twice.
          const already = entity[childModel.nodeName].some((x: any) => x.id === childEntity.id);
          if (!already) {
            entity[childModel.nodeName].push(childEntity);
          }
        }
      }
    }

    return entity;
  }
}
