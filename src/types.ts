/**
 * Engine
 */
export interface EngineType<I, C extends string | number, D> {
	setSystems: (...systems: SystemFunction<C>[]) => void;

	getEntityList: () => EntityType<I, C, D>[];
	getEntityListByType: (type: I) => EntityType<I, C, D>[];
	getEntityListByComponents: (...componentList: C[]) => EntityType<I, C, D>[];

	getEntity: (id: number) => EntityType<I, C, D>;
	addEntity: (...entities: SimpleEntityType<I, C, D>[]) => EntityType<I, C, D>[];
	removeEntity: (...idList: number[]) => void;

	getSystem: (name: number) => SystemType<C> | undefined;

	clear: () => void;

	load: () => void;
	destroy: () => void;

	getUID: () => number;
}

/**
 * System
 */
export interface SystemType<C> {
	id: number;
	components: C[];
	onAdd?: (id: number) => void;
	onUpdate?: (id: number, component?: C) => void;
	onRemove?: (id: number) => void;

	onLoad?: () => void;
	onDestroy?: () => void;
}

export type SystemFunction<C> = () => Omit<SystemType<C>, 'id'>;

/**
 * Entity
 */

export interface EntityType<I, C extends string | number, D> {
	//Only initial declaration
	readonly type: I;
	readonly data: Partial<D>;
	readonly components: C[];

	id: number;
	getData: () => Record<number, any>;
	getComponent: <T extends keyof D>(
		component: T,
		deepClone?: boolean,
	) => D[T];
	getComponents: <T extends keyof D>(
		components: T[],
		deepClone?: boolean,
	) => { [K in T]: D[K] };
	getComponentTypes: () => C[],
	hasComponent: (component: number) => boolean;
	updateComponent: <T extends keyof D>(component: T, data?: D[T]) => EntityType<I, C, D>;
	removeComponent: (component: C) => void;
	
}

export type SimpleEntityType<I, C extends string | number, D> = Omit<
	EntityType<I, C, D>,
	| 'getData'
	| 'getComponent'
	| 'getComponents'
	| 'getComponentTypes'
	| 'hasComponent'
	| 'updateComponent'
	| 'removeComponent'
>;

export type EntityTypeFunction<I, C extends string | number, D> = () => SimpleEntityType<I, C, D>;

export type DarkerMap<T extends string | number, S> = { [key in T]: S };
