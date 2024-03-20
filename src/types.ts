export type ActionConfig = {
	force?: boolean;
	priority?: Priority;
};

// Add Entity
export type AddEntityProcessorProps<I, C extends string | number, D> = {
	entities: SimpleEntityType<I, C, D>[];
};
export type AddEntityProps<I, C extends string | number, D> =
	& ActionConfig
	& AddEntityProcessorProps<I, C, D>;

// Remove Entity
export type RemoveEntityProcessorProps = {
	ids: number[];
};
export type RemoveEntityProps = ActionConfig & RemoveEntityProcessorProps;

// Add Component
export type AddComponentProps<C, D, T extends keyof D> = {
	entityId: number;
	component: C;
	data?: D[T];
};

// Remove Component
export type RemoveComponentProcessorProps<C> = {
	entityId: number;
	component: C;
};
export type RemoveComponentProps<C> = ActionConfig & RemoveComponentProcessorProps<C>;

// Update Component
export type UpdateComponentProcessorProps<C, D, T extends keyof D> = {
	entityId: number;
	component: C;
	data?: D[T];
};
export type UpdateComponentProps<C, D, T extends keyof D> =
	& ActionConfig
	& UpdateComponentProcessorProps<C, D, T>;

/**
 * Engine
 */
export interface EngineType<I, C extends string | number, D> {
	setSystems: (...systems: SystemFunction<C>[]) => Promise<void>;

	getEntityList: () => EntityType<I, C, D>[];
	getEntityListByType: (type: I) => EntityType<I, C, D>[];
	getEntityListByComponents: (...componentList: C[]) => EntityType<I, C, D>[];

	getEntity: (id: number) => EntityType<I, C, D> | undefined;
	addEntity: (config: AddEntityProps<I, C, D>) => Promise<number | EntityType<I, C, D>[]>;
	removeEntity: (config: RemoveEntityProps) => Promise<number | void>;

	getSystem: (name: number) => SystemType<C> | undefined;

	clear: () => void;

	load: (config?: LoadConfig) => Promise<void>;
	pause: () => Promise<void>;
	resume: () => Promise<void>;
	hardReload: () => Promise<void>;

	onTick: (cb: OnTickFunction) => void;

	__debug__: {
		swapSystem: (systemId: number, system: SystemFunction<C>) => Promise<void>;
		getSystem: (name: string) => SystemType<C> | undefined;
	};
}

export type LoadConfig = {
	ticksPerSecond?: number;
};

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
	onResume?: () => Promise<void>;
	onPause?: () => Promise<void>;
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

	id?: number;
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
		config: Omit<UpdateComponentProps<C, D, T>, 'entityId'>,
	) => Promise<number | EntityType<I, C, D> | undefined>;
	removeComponent: (config: Omit<RemoveComponentProps<C>, 'entityId'>) => Promise<number | void>;
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
	props?: P,
) => SimpleEntityType<I, C, D>;

export type DarkerMap<T extends string | number, S> = { [key in T]: S };

export enum Priority {
	LOW,
	MEDIUM,
	HIGH,
}

export enum ActionTypes {
	ADD_ENTITY,
	REMOVE_ENTITY,
	UPDATE_COMPONENT,
	REMOVE_COMPONENT,
}

// TODO: add correct type for Updatecompoonent
type ActionPayloads<I, C extends string | number, D> = {
	[ActionTypes.ADD_ENTITY]: AddEntityProcessorProps<I, C, D>;
	[ActionTypes.REMOVE_ENTITY]: RemoveEntityProcessorProps;
	[ActionTypes.UPDATE_COMPONENT]: UpdateComponentProcessorProps<I, C, any>;
	[ActionTypes.REMOVE_COMPONENT]: RemoveComponentProcessorProps<C>;
};

export type QueueAction<I, C extends string | number, D, K extends ActionTypes = ActionTypes> = {
	id: number;
	type: K;
	priority?: Priority;
	payload: ActionPayloads<I, C, D>[K];
};

// TODO: add correct type for result
export type ActionCompleted = {
	id: number;
	type: ActionTypes;
	result: any;
};

export type OnTickFunction = (data: {
	status: ActionCompleted | undefined;
	ms: number;
	usage: number;
	tickCount: number;
}) => void;
