/**
 * Engine
 */
export interface EngineType<C,D> {
	setSystems: (...systems: SystemFunction[]) => void;

	getEntityList: () => EntityType<C,D>[];
	getEntityListByType: (type: number) => EntityType<C,D>[];
	getEntityListByComponents: (...componentList: number[]) => EntityType<C,D>[];

	getEntity: (id: number) => EntityType<C,D>;
	addEntity: (...entities: EntityType<C,D>[]) => EntityType<C,D>[];
	removeEntity: (...idList: number[]) => void;

	getSystem: (name: number) => SystemType | undefined;

	clear: () => void;

	load: () => void;
	destroy: () => void;

	getUID: () => number;
}

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
export interface EntityType<C,D> {
	//Only initial declaration
	readonly id: number;
	readonly type: number;
	readonly data: Record<number, any>;
	readonly components: number[];

	getData?: () => Record<number, any>;
	getComponent?: <T extends keyof D>(
		component: T,
		deepClone?: boolean,
	) => D[T] | undefined;
	getComponents?: () => number[];
	hasComponent?: (component: number) => boolean;
	updateComponent?: UpdateComponentFunctionType;
	removeComponent?: RemoveComponentFunctionType;
}

export type UpdateComponentFunctionType = <ComponentType>(
	component: number,
	data: ComponentType,
) => void;
export type RemoveComponentFunctionType = (component: number) => void;
