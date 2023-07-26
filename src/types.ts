/**
 * Engine
 */
export interface EngineType {
  setSystems: (...systems: SystemFunction[]) => void;

  getEntityList: () => EntityType[];
  getEntityListByType: (type: number) => EntityType[];
  getEntityListByComponents: (...componentList: number[]) => EntityType[];

  getEntity: (id: number) => EntityType;
  addEntity: (...entities: EntityType[]) => EntityType[];
  removeEntity: (...idList: number[]) => void;

  getSystem: (name: number) => SystemType | undefined;

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
  id: number;
  components: number[];
  onAdd?: (id: number) => void;
  onUpdate?: (id: number, component?: number) => void;
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
  readonly data: Record<number, any>;
  readonly components: number[];

  getData?: () => Record<number, any>;
  getComponent?: <ComponentType>(
    component: number,
    deepClone?: boolean,
  ) => ComponentType;
  getComponents?: () => number[];
  hasComponent?: (component: number) => boolean;
  updateComponent?: UpdateComponentFunctionType;
  removeComponent?: RemoveComponentFunctionType;
}

export type UpdateComponentFunctionType = <ComponentType>(
  component: number,
  data: ComponentType,
) => void;
export type RemoveComponentFunctionType = (component: number) => void;
