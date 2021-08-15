
/**
 * Game
 */
export interface GameType {
    setSystems?: (...systems: SystemFunction[]) => any;
    getEntityList?: () => EntityType[],

    getEntity?: (id: string) => EntityType,
    addEntity?: (...entities: EntityType[]) => any,
    removeEntity?: (...idList: string[]) => any

    getSystem?: (name: string) => SystemType;
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
    onDataUpdate?: <Data>(data: Data) => any;
    
    _data: any;
    _dataListenerList: any[];
    
    getData: <Data>() => Data;
    updateData: <Data>(data: Data) => void;
    
    addDataListener: (callback: <Data>(data: Data) => any) => number;
    removeDataListener: (id: number) => any;
}

export type SystemFunctionProps = {
    getEntityList?: () => string[];
    
    getData?: <Data>() => Data;
    updateData?: <Data>(data: Data) => void;
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
    removeComponent?: (component: any) => any;
    updateComponent?: <ComponentType>(component: any, data: ComponentType) => any;
}

export type EntityFunction = (...props: any) => EntityType;
