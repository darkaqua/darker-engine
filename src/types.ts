
/**
 * Game
 */
export interface GameType<SystemEnum, ComponentEnum> {
    entities: EntitiesType<ComponentEnum>;
    onLoop: (delta: number) => any;
    setSystems: (...systems: SystemType<SystemEnum, ComponentEnum>[]) => any;
    getSystemEntities?: (system: SystemEnum) => string[];
}

export type GameFunction = <SystemEnum, ComponentEnum>() => GameType<SystemEnum, ComponentEnum>;

/**
 * System
 */
export interface SystemType<SystemEnum, ComponentEnum> {
    id: SystemEnum;
    components: ComponentEnum[];
    onLoop?: (delta: number) => any;
    onAdd: (id: string) => any;
    onRemove: (id: string) => any;
    getEntities?: () => string[];
}

export type SystemFunction<SystemEnum, ComponentEnum> = () => SystemType<SystemEnum, ComponentEnum>;

/**
 * Entity
 */
export interface EntityType<ComponentEnum> {
    id: string;
    getData?: () => any;
    getComponent?: (component: ComponentEnum) => any;
    components: ComponentEnum[];
    addComponent?: (component: ComponentEnum) => any;
    removeComponent?: (component: ComponentEnum) => any;
    updateComponent?: (component: ComponentEnum, data: any) => any;
}

export type EntityFunction<ComponentEnum> = (...props: any) => EntityType<ComponentEnum>;

/**
 * Entities
 */
export interface EntitiesType<ComponentEnum> {
    getList: () => EntityType<ComponentEnum>[],

    get: (id: string) => EntityType<ComponentEnum>,
    add: (...entities: EntityType<ComponentEnum>[]) => any,
    remove: (id: string) => any
}

export type EntitiesFunction = <ComponentEnum>() => EntitiesType<ComponentEnum>;
