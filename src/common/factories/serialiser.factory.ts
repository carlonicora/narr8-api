import { Injectable, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DataModelInterface } from "src/common/interfaces/datamodel.interface";

@Injectable()
export class SerialiserFactory {
  constructor(private readonly moduleRef: ModuleRef) {}

  create<T extends DataModelInterface<any>>(model: T, params?: any): InstanceType<T["serialiser"]> {
    const SerialiserClass = model.serialiser as Type<InstanceType<T["serialiser"]>>;

    if (!SerialiserClass) {
      throw new Error("Serialiser not found");
    }

    // Resolve the service using ModuleRef
    const serialiserService = this.moduleRef.get<InstanceType<T["serialiser"]>>(SerialiserClass, { strict: false });

    if (!serialiserService) {
      throw new Error(`Serialiser service for ${SerialiserClass.name} not found in the container`);
    }

    // If parameters need to be passed, use an explicit method on the service
    if (params && "setParams" in serialiserService && typeof serialiserService.setParams === "function") {
      (serialiserService as any).setParams(params);
    }

    return serialiserService;
  }
}
