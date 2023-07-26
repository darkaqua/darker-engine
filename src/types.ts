/**
 * Engine
 */
export interface EngineType {
  setSystems: (...systems: SystemFunction[]) => any;

  getEntityList: () => EntityType[];
  getEntityListByType: (type: number) => EntityType[];
  getEntityListByComponents: (...componentList: unknown[]) => EntityType[];

  getEntity: (id: number) => EntityType;
  addEntity: (...entities: EntityType[]) => EntityType[];
  removeEntity: (...idList: number[]) => void;

  getSystem: (name: string) => SystemType | undefined;

  clear: () => void;

  load: () => void;
  destroy: () => void;

  getUID: () => number;
}

export type EngineFunction = () => EngineType;

/**
 * System
 */
export interface SystemType {
  id: string;
  components: unknown[];
  onAdd?: (id: number) => void;
  onUpdate?: (id: number, component?: unknown) => void;
  onRemove?: (id: number) => void;

  onLoad?: () => void;
  onDestroy?: () => void;
}

export type SystemFunction = () => SystemType;

/**
 * Entity
 */
export interface EntityType {
  //Only initial declaration
  readonly id: number;
  readonly type: number;
  readonly data: Record<unknown, Object>;
  readonly components: unknown[];

  getData?: () => Record<string, Object>;
  getComponent?: <ComponentType>(
    component: string,
    deepClone?: boolean,
  ) => ComponentType;
  getComponents?: () => string[];
  hasComponent?: (component: string) => boolean;
  updateComponent?: UpdateComponentFunctionType;
  removeComponent?: RemoveComponentFunctionType;
  // shortcuts
  actions?: Record<string, <T>(data?: T) => unknown>;
}

export type UpdateComponentFunctionType = <ComponentType>(
  component: string,
  data: ComponentType,
) => void;
export type RemoveComponentFunctionType = (component: string) => void;
