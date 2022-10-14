
/**
 * Game
 */
export interface GameType {
    setSystems?: (...systems: SystemFunction[]) => any;
    
    getEntityList?: () => EntityType[],
    getEntityListByType?: (type: number) => EntityType[],
    getEntityListByComponents?: (...componentList: string[]) => EntityType[],

    getEntity?: (id: number) => EntityType,
    addEntity?: (...entities: EntityType[]) => EntityType[],
    removeEntity?: (...idList: number[]) => any

    getSystem?: (name: string) => SystemType;
    
    clear?: () => any;

    load?: () => any;
    onLoad?: (callback: () => any) => any;

    destroy?: () => any;
    onDestroy?: (callback: () => any) => any;
    
    getUID: () => number;
}

export type GameFunction = () => GameType;

/**
 * System
 */
export interface SystemType {
    id?: string;
    components: string[];
    onAdd?: (id: number) => any;
    onUpdate?: (id: number, component?: string) => any;
    onRemove?: (id: number) => any;
}

export type SystemFunction = () => SystemType;

/**
 * Entity
 */
export interface EntityType {
    //Only initial declaration
    readonly id: number;
    readonly type: number;
    readonly data: Record<string, Object>;
    readonly components: string[];
    readonly shortcuts?: Record<string, <T>(entity: EntityType, data?: T) => any>;

    getData?: () => Record<string, Object>;
    getComponent?: <ComponentType>(component: string, deepClone?: boolean) => ComponentType;
    getComponents?: () => any[];
    hasComponent?: (component: string) => boolean;
    updateComponent?: UpdateComponentFunctionType;
    removeComponent?: RemoveComponentFunctionType;
    // shortcuts
    actions?: Record<string, <T>(data?: T) => any>;
}

export type UpdateComponentFunctionType = <ComponentType>(component: any, data: ComponentType) => any;
export type RemoveComponentFunctionType = (component: any) => any;
