import { JsonApiBuilderInterface } from "./JsonApiBuilderInterface";

export type transformFunction<T> = (data: T) => any;

export interface JsonApiDataInterface {
  type: string;
  id: string | transformFunction<any>;
  attributes: {
    [key: string]: any;
  };
  meta?: {
    [key: string]: any;
  };
  links?: {
    self: transformFunction<any>;
  };
  relationships?: {
    [key: string]: {
      resourceIdentifier?: {
        type: string;
        id: string | transformFunction<any>;
      };
      data?: JsonApiBuilderInterface;
      forceSingle?: boolean;
      excluded?: boolean;
      name?: string;
      links?: {
        related?: transformFunction<any>;
      };
    };
  };
}
