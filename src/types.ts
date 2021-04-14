
/**
 * Game
 */
export interface GameType<SystemEnum, ComponentEnum> {
    setSystems?: (...systems: SystemFunction<SystemEnum, ComponentEnum>[]) => any;
    getEntityList?: () => EntityType<ComponentEnum>[],

    getEntity?: (id: string) => EntityType<ComponentEnum>,
    addEntity?: (...entities: EntityType<ComponentEnum>[]) => any,
    removeEntity?: (id: string) => any
}

export type GameFunction = <SystemEnum, ComponentEnum>() => GameType<SystemEnum, ComponentEnum>;

/**
 * System
 */
export interface SystemType<SystemEnum, ComponentEnum> {
    id: SystemEnum;
    components: ComponentEnum[];
    onAdd?: (id: string) => any;
    onUpdate?: (id: string, component?: ComponentEnum) => any;
    onRemove?: (id: string) => any;
}

export type SystemFunctionProps<SystemEnum, ComponentEnum> = {
    getEntityList?: () => string[];
}

export type SystemFunction<SystemEnum, ComponentEnum> =
    (props: SystemFunctionProps<SystemEnum, ComponentEnum>) => SystemType<SystemEnum, ComponentEnum>;

/**
 * Entity
 */
export interface EntityType<ComponentEnum> {
    id: string;
    data: any;
    getData?: () => any;
    getComponent?: <ComponentType>(component: ComponentEnum) => ComponentType;
    components: ComponentEnum[];
    hasComponent?: (component: ComponentEnum) => boolean;
    addComponent?: <ComponentType>(component: ComponentEnum, data: ComponentType) => any;
    removeComponent?: (component: ComponentEnum) => any;
    updateComponent?: <ComponentType>(component: ComponentEnum, data: ComponentType) => any;
}

export type EntityFunction<ComponentEnum> = (...props: any) => EntityType<ComponentEnum>;