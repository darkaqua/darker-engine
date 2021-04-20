
/**
 * Game
 */
export interface GameType {
    setSystems?: (...systems: SystemFunction[]) => any;
    getEntityList?: () => EntityType[],

    getEntity?: (id: string) => EntityType,
    addEntity?: (...entities: EntityType[]) => any,
    removeEntity?: (id: string) => any
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
    addComponent?: <ComponentType>(component: any, data: ComponentType) => any;
    removeComponent?: (component: any) => any;
    updateComponent?: <ComponentType>(component: any, data: ComponentType) => any;
}

export type EntityFunction = (...props: any) => EntityType;
