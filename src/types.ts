/**
 * Engine
 */
export interface EngineType<E,C extends string|number|symbol> {
	setSystems: (...systems: SystemFunction[]) => void;

	getEntityList: () => EntityType<E,C>[];
	getEntityListByType: (type: number) => EntityType<E,C>[];
	getEntityListByComponents: (...componentList: number[]) => EntityType<E,C>[];

	getEntity: (id: E) => EntityType<E, C>;
	addEntity: (...entities: EntityType<E,C>[]) => EntityType<E,C>[];
	removeEntity: (...idList: number[]) => void;

	getSystem: (name: number) => SystemType | undefined;

	clear: () => void;

	load: () => void;
	destroy: () => void;

	getUID: () => number;
}

export type EngineFunction<E,C> = () => EngineType<E,C>;

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
export interface EntityType<E, C extends string | number | symbol> {
	//Only initial declaration
	readonly id: number;
	readonly type: E;
	readonly data: {[key in C]?: unknown};
	readonly components: C[];

	getData?: () => {[key in C]?: unknown}
	getComponent?: <ComponentType>( // TODO: ver si es necesario, o si se puede hacer sin pasar el tipo al ya ir tipado de arriba
		component: C,
		deepClone?: boolean,
	) => ComponentType;
	getComponents?: () => C[];
	hasComponent?: (component: C) => boolean;
	updateComponent?: UpdateComponentFunctionType;
	removeComponent?: RemoveComponentFunctionType;
}

export type UpdateComponentFunctionType = <ComponentType>(
	component: number,
	data: ComponentType,
) => void;
export type RemoveComponentFunctionType = (component: number) => void;
