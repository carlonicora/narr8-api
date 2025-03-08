export type Entity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  recordCount?: number;

  relationshipName?: string;
};

export const mapEntity = (params: { record: any }): Entity => ({
  id: params.record?.id ?? "",
  createdAt: params.record.createdAt ? new Date(params.record.createdAt) : new Date(),
  updatedAt: params.record.updatedAt ? new Date(params.record.updatedAt) : new Date(),

  recordCount: params.record.recordCount,
});

export function trimParentPrefix(columnName: string): string {
  const idx = columnName.indexOf("_");
  if (idx < 0) return columnName;
  return columnName.substring(idx + 1);
}
