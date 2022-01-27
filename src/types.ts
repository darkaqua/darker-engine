
/**
 * Game
 */
export interface GameType {
    setSystems?: (...systems: SystemFunction[]) => any;
    getEntityList?: () => EntityType[],

    getEntity?: (id: string) => EntityType,
    addEntity?: (...entities: EntityType[]) => EntityType[],
    removeEntity?: (...idList: string[]) => any

    getSystem?: (name: string) => SystemType;
    
    load?: () => any;
    onLoad?: (callback: () => any) => any;
}

export type GameFunction = () => GameType;

/**
 * System
 */
export interface SystemType {
    _id?: string;
    components: any[];
    onAdd?: (id: string) => any;
    onUpdate?: (id: string, component?: any) => any;
    onRemove?: (id: string) => any;
    // onDataUpdate?: (data: any) => any;
    
    // _data?: any;
    // _dataListenerList?: any[];
    //
    // getData?: <DataType>() => DataType;
    // updateData?: <DataType>(data: DataType) => void;
    //
    // addDataListener?: (callback: (data: any) => any) => number;
    // removeDataListener?: (id: number) => any;
}

export type SystemFunctionProps = {
    getEntityList?: () => string[];
    
    // getData?: <DataType>() => DataType;
    // updateData?: <DataType>(data: DataType) => void;
}

export type SystemFunction =
    (props: SystemFunctionProps) => SystemType;

/**
 * Entity
 */
export interface EntityType {
    id: string;
    data: any;
    getData?: () => any;
    getComponent?: <ComponentType>(component: any) => ComponentType;
    components: any[];
    hasComponent?: (component: any) => boolean;
    updateComponent?: UpdateComponentFunctionType;
    removeComponent?: RemoveComponentFunctionType;
    // listeners
    _updateListenerList?: any[];
    _removeListenerList?: any[];
    addUpdateComponentListener?: (callback: UpdateComponentFunctionType) => number;
    addRemoveComponentListener?: (callback: RemoveComponentFunctionType) => number;
    removeUpdateComponentListener?: (id: number) => any;
    removeRemoveComponentListener?: (id: number) => any;
    // shortcuts
    actions?: Record<string, <T>(data?: T) => any>;
    shortcuts?: Record<string, <T>(entity: EntityType, data?: T) => any>;
}

export type UpdateComponentFunctionType = <ComponentType>(component: any, data: ComponentType) => any;
export type RemoveComponentFunctionType = (component: any) => any;

export type EntityFunction = (...props: any) => EntityType;
