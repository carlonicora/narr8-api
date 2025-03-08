// src/common/registry/model.registry.ts
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";

export class ModelRegistry {
  private models = new Map<string, DataModelInterface<any>>();

  public register(model: DataModelInterface<any>): void {
    this.models.set(model.nodeName, model);
  }

  public get(nodeName: string): DataModelInterface<any> | undefined {
    const model = this.models.get(nodeName);
    return model;
  }
}

export const modelRegistry = new ModelRegistry();
