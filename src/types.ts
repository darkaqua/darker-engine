
/**
 * Game
 */
export interface GameType {
    setSystems?: (...systems: SystemFunction<any>[]) => any;
    getEntityList?: () => EntityType[],

    getEntity?: (id: string) => EntityType,
    addEntity?: (...entities: EntityType[]) => any,
    removeEntity?: (...idList: string[]) => any
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
}

export type SystemFunctionProps = {
    getEntityList?: () => string[];
}

export type SystemFunction<T = {}> =
    (props: SystemFunctionProps) => SystemType & T;

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
