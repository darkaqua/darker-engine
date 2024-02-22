/**
 * Engine
 */
export interface EngineType<I, C extends string | number, D> {
	setSystems: (...systems: SystemFunction<C>[]) => Promise<void>;

	getEntityList: () => EntityType<I, C, D>[];
	getEntityListByType: (type: I) => EntityType<I, C, D>[];
	getEntityListByComponents: (...componentList: C[]) => EntityType<I, C, D>[];

	getEntity: (id: number) => EntityType<I, C, D> | undefined;
	addEntity: (
		...entities: SimpleEntityType<I, C, D>[]
	) => Promise<EntityType<I, C, D>[]>;
	removeEntity: (...idList: number[]) => Promise<void>;

	getSystem: (name: number) => SystemType<C> | undefined;

	clear: () => void;

	load: () => Promise<void>;
	hardReload: () => Promise<void>;

	__debug__: {
		swapSystem: (systemId: number, system: SystemFunction<C>) => Promise<void>;
		getSystem: (name: string) => SystemType<C> | undefined;
	};
}

/**
 * System
 */
export interface SystemType<C> {
	id: number;
	name: string;
	components: C[];
	onAdd?: (id: number) => Promise<void>;
	onUpdate?: (id: number, component?: C) => Promise<void>;
	onRemove?: (id: number) => Promise<void>;

	onLoad?: () => Promise<void>;
	onDestroy?: () => Promise<void>;
}

export type SystemFunction<C> = () => Promise<
	Omit<SystemType<C>, 'id' | 'name'>
>;

/**
 * Entity
 */

export interface EntityType<I, C extends string | number, D> {
	//Only initial declaration
	readonly type: I;
	readonly data: Partial<D>;
	readonly components: C[];

	id: number;
	safe?: boolean;
	getData: () => Record<number, any>;
	getComponent: <T extends keyof D>(component: T, deepClone?: boolean) => D[T];
	getComponents: <T extends keyof D>(
		components: T[],
		deepClone?: boolean,
	) => { [K in T]: D[K] };
	getComponentTypes: () => C[];
	hasComponent: (component: number) => boolean;
	updateComponent: <T extends keyof D>(
		component: T,
		data?: D[T],
	) => Promise<EntityType<I, C, D> | undefined>;
	removeComponent: (component: C) => Promise<void>;
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

export type EntityTypeFunction<I, C extends string | number, D, P> = (
	props: P,
) => SimpleEntityType<I, C, D>;

export type DarkerMap<T extends string | number, S> = { [key in T]: S };
