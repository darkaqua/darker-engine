import {
	ActionCompleted,
	ActionTypes,
	AddComponentProps,
	AddEntityProcessorProps,
	AddEntityProps,
	DarkerMap,
	EngineType,
	EntityType,
	LoadConfig,
	Priority,
	QueueAction,
	RemoveComponentProcessorProps,
	RemoveComponentProps,
	RemoveEntityProcessorProps,
	RemoveEntityProps,
	SystemFunction,
	SystemType,
	UpdateComponentProcessorProps,
	UpdateComponentProps,
} from './types.ts';
import { uid, UIDKey } from './uid.ts';

export const engine = <
	I extends string | number,
	C extends string | number,
	D,
>(): EngineType<I, C, D> => {
	let systems: SystemType<C>[] = [];
	let entityList: EntityType<I, C, D>[] = [];
	let typeEntityMap: DarkerMap<I, number[]> = {} as DarkerMap<I, number[]>;
	let entityComponentMap: DarkerMap<number, C[]> = {};
	// Contains which components/data has every entity
	let entityDataMap: DarkerMap<number, any> = [];
	// Contains which entities has every system
	let systemEntitiesMap: number[][] = [];

	let queueLow: QueueAction<I, C, D>[] = [];
	let queueMedium: QueueAction<I, C, D>[] = [];
	let queueHigh: QueueAction<I, C, D>[] = [];

	let loopRunning = false;
	let ticks = 60;
	let onTick: ((action: ActionCompleted | undefined) => void) | undefined = undefined;
	let lastTick = Date.now();

	const { getUID } = uid(() => entityList);

	const setSystems = async (..._systems: SystemFunction<C>[]) => {
		systems = [];
		systemEntitiesMap = [];

		for await (const system of _systems) {
			const _system = (await system()) as SystemType<C>;
			_system.name = system.name;
			_system.id = _system.id ?? getUID(UIDKey.SYSTEM);
			systemEntitiesMap[_system.id] = [];
			systems[_system.id] = _system;
		}
	};

	const _entity_updateComponent = async <T extends keyof D>({
		force = false,
		priority = Priority.MEDIUM,
		entityId,
		component,
		data,
	}: UpdateComponentProps<C, D, T>) => {
		if (force) {
			return _processor_entity_updateComponent({ entityId, component, data });
		}

		const queue: QueueAction<I, C, D> = {
			id: getUID(UIDKey.INTERNAL),
			type: ActionTypes.UPDATE_COMPONENT,
			priority,
			payload: {
				entityId,
				component,
				data,
			},
		};

		return addActionToQueue(queue);
	};

	const _entity_removeComponent = async ({
		force = false,
		priority = Priority.MEDIUM,
		entityId,
		component,
	}: RemoveComponentProps<C>) => {
		if (force) {
			return _processor_entity_removeComponent({ entityId, component });
		}

		const queue: QueueAction<I, C, D> = {
			id: getUID(UIDKey.INTERNAL),
			type: ActionTypes.REMOVE_COMPONENT,
			priority,
			payload: {
				entityId,
				component,
			},
		};

		return addActionToQueue(queue);
	};

	const _processor_entity_removeComponent = async (
		{ entityId, component }: RemoveComponentProcessorProps<C>,
	) => {
		const entity = getEntity(entityId);
		if (!entity) {
			return console.warn(
				`Warning "removeComponent::(${entityId},${component})" undefined`,
			);
		}

		entityComponentMap[entityId] = entityComponentMap[entityId].filter(
			(_component) => _component !== component,
		);

		const systemList = systems
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return entities?.includes(entityId) ?? false;
			})
			.filter(
				(system) =>
					!system.components.every(
						(_component) => entityComponentMap[entityId]?.includes(_component),
					),
			)
			.reverse();

		for await (const system of systemList) {
			const entities = systemEntitiesMap[system.id];
			systemEntitiesMap[system.id] = entities?.filter((_id) => _id !== entityId) ?? [];
			try {
				await system?.onRemove?.(entityId);
			} catch (e) {
				console.warn(
					`Error catch system::${system.id} "onRemove(${entityId})"`,
				);
				console.error(e);
			}
		}

		return;
	};

	const _processor_entity_updateComponent = async <T extends keyof D>({
		entityId,
		component,
		data,
	}: UpdateComponentProcessorProps<C, D, T>) => {
		const entity = getEntity(entityId);
		if (!entity) {
			console.warn(
				`Warning "updateComponent::(${entityId},${component})" undefined`,
			);
			return entity;
		}

		if (!entityComponentMap[entityId]?.includes(component)) {
			return await _processor_entity_addComponent({ entityId, component, data });
		}

		const currentData = entityDataMap[entity.id!];
		entityDataMap[entity.id!] = {
			...currentData,
			[component]: { ...(currentData[component] || {}), ...data },
		};

		const systemList = systems
			//Only filters the current updated component
			.filter((system) => system.components.includes(component))
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return entities?.includes(entityId) ?? false;
			});

		for await (const system of systemList) {
			try {
				await system?.onUpdate?.(entityId, component);
			} catch (e) {
				console.warn(
					`Error catch system::${system.id} "onUpdate(${entityId}, ${component})"`,
				);
				console.error(e);
			}
		}

		return entity;
	};

	const _processor_entity_addComponent = async <T extends keyof D>({
		entityId,
		component,
		data,
	}: AddComponentProps<C, D, T>) => {
		const entity = getEntity(entityId);
		if (!entity) {
			console.warn(
				`Warning "addComponent::(${entityId},${component})" undefined`,
			);
			return entity;
		}

		entityComponentMap[entity.id!].push(component);
		entityDataMap[entity.id!] = {
			...entityDataMap[entity.id!],
			[component]: data,
		};

		const systemList = systems
			.filter((system) => system.components.includes(component))
			// Cuando los sistemas no contengan la entidad actual
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return !entities?.includes(entityId) ?? true;
			})
			// Cuando la entidad tenga los componentes correspondientes a ese sistema
			.filter((system) =>
				system.components.every(
					(_component) => entityComponentMap[entityId]?.includes(_component),
				)
			);

		for await (const system of systemList) {
			const entities = systemEntitiesMap[system.id];
			systemEntitiesMap[system.id] = [...(entities ?? []), entityId];
			try {
				await system?.onAdd?.(entityId);
			} catch (e) {
				console.warn(`Error catch system::${system.id} "onAdd(${entityId})"`);
				console.error(e);
			}
		}
		return entity;
	};

	// TODO: maintain original order, not this shit
	const _entity_getComponentTypes = (entityId: number) => entityComponentMap[entityId];

	const _entity_getComponent = <T extends keyof D>(
		entityId: number,
		component: T,
		deepClone = false,
	): D[T] => {
		const entityData = entityDataMap[entityId];

		return entityData && entityData[component]
			? deepClone ? structuredClone(entityData[component]) : { ...entityData[component] }
			: {};
	};

	const _entity_getComponents = <T extends keyof D>(
		entityId: number,
		components: T[],
		deepClone = false,
	): { [K in T]: D[K] } => {
		const entityData = entityDataMap[entityId];

		return components.reduce(
			(acc, component) => {
				const data = entityData[component];
				if (!data) return acc;

				acc[component] = deepClone ? structuredClone(data) : data;
				return acc;
			},
			{} as { [K in T]: D[K] },
		);
	};

	const _entity_hasComponent = (entityId: number, component: any) =>
		entityComponentMap[entityId]?.includes(component);

	const _entity_getData = (entityId: number) => structuredClone(entityDataMap[entityId]);

	const getEntityList = (): EntityType<I, C, D>[] => Object.values(entityList) || [];

	const getEntityListByType = (type: I): EntityType<I, C, D>[] =>
		typeEntityMap[type]?.map((entityId) => entityList[entityId]) || [];

	const getEntityListByComponents = (
		...componentList: C[]
	): EntityType<I, C, D>[] => {
		return entityList
			.reduce((list, entity) => {
				const entityComponents = entityComponentMap[entity.id!];
				if (
					componentList.length === 0 ||
					componentList.every((component) => entityComponents.includes(component))
				) {
					return [...list, entity];
				}

				return list;
			}, Array<EntityType<I, C, D>>())
			.filter(Boolean);
	};

	const addEntity = async ({
		force = false,
		priority = Priority.MEDIUM,
		entities,
	}: AddEntityProps<I, C, D>) => {
		if (force) {
			return _processor_addEntity({ entities });
		}

		const queue: QueueAction<I, C, D> = {
			id: getUID(UIDKey.INTERNAL),
			type: ActionTypes.ADD_ENTITY,
			priority,
			payload: {
				entities,
			},
		};

		return addActionToQueue(queue);
	};

	const removeEntity = async ({
		force = false,
		priority = Priority.MEDIUM,
		ids,
	}: RemoveEntityProps) => {
		if (force) {
			return _processor_removeEntity({ ids });
		}

		const queue: QueueAction<I, C, D> = {
			id: getUID(UIDKey.INTERNAL),
			type: ActionTypes.REMOVE_ENTITY,
			priority,
			payload: {
				ids,
			},
		};

		return addActionToQueue(queue);
	};

	const getEntity = (entityId: number): EntityType<I, C, D> | undefined => {
		const entity = entityList[entityId];
		if (!entity) {
			console.warn(`Warning "internal::getEntity(${entityId})" undefined`);
		}
		return entity;
	};

	const _processor_addEntity = async ({
		entities: rawEntities,
	}: AddEntityProcessorProps<I, C, D>): Promise<EntityType<I, C, D>[]> => {
		const date = Date.now();
		const entities = rawEntities.map((rawEntity) => {
			const entity = rawEntity as EntityType<I, C, D>;

			entity.id = entity.id ?? getUID(UIDKey.ENTITY, entity.safe);
			entity.getData = () => _entity_getData(entity.id!);
			entity.getComponent = (component, deepClone) =>
				_entity_getComponent(entity.id!, component, deepClone);
			entity.getComponentTypes = () => _entity_getComponentTypes(entity.id!);
			entity.getComponents = (components, deepClone) =>
				_entity_getComponents(entity.id!, components, deepClone);
			entity.hasComponent = (component) => _entity_hasComponent(entity.id!, component);
			entity.removeComponent = ({ component }) =>
				_entity_removeComponent({ entityId: entity.id!, component });
			entity.updateComponent = ({ component, data }) =>
				_entity_updateComponent({
					entityId: entity.id!,
					component: component as unknown as C,
					data,
				});

			if (!typeEntityMap[entity.type]) {
				typeEntityMap[entity.type] = [];
			}
			typeEntityMap[entity.type].push(entity.id);

			entityComponentMap[entity.id] = entity.components;

			entityDataMap[entity.id] = entity?.getComponentTypes?.()?.reduce(
				(acc, b) => ({
					...acc,
					[b]: (acc as any)[b] || {},
				}),
				entity.data,
			) ?? {};
			entityList[entity.id] = entity;
			return entity;
		});

		for await (const entity of entities) {
			// Calculate points from component order.
			const componentMapPoint: { [key: string]: number } = entity.components.reduce(
				(obj, com, ind) => ({ ...obj, [com]: ind ** 2 }),
				{},
			);

			const systemList = systems
				.map((system) => ({
					system,
					// Assign system by component points order
					points: system.components.reduce(
						(points, component) => componentMapPoint[component] + points,
						0,
					),
				}))
				.filter((system) => !isNaN(system.points))
				.sort((systemA, systemB) =>
					systemB.points > systemA.points ? -1 : systemB.points === systemA.points ? 0 : 1
				)
				.map(({ system }) => system);

			for await (const system of systemList) {
				const systemEntities = systemEntitiesMap[system.id];
				systemEntitiesMap[system.id] = [...(systemEntities ?? []), entity.id!];
				try {
					await system?.onAdd?.(entity.id!);
				} catch (e) {
					console.warn(
						`Error catch system::${system.id} "onUpdate(${entity.id})"`,
					);
					console.error(e);
				}
			}
		}

		const ms = Date.now() - date;
		if (ms > 500) {
			console.warn(
				`addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${entityList.length}`,
			);
		}
		return entities;
	};

	const _processor_removeEntity = async ({ ids }: RemoveEntityProcessorProps) => {
		const _entityList = ids.map((entityId) => entityList[entityId]);

		for await (const entity of _entityList) {
			if (!entity) return;
			const componentEntityList = entity?.getComponentTypes?.();
			if (!componentEntityList) return;

			// Calculate points from component order.
			const componentMapPoint: { [key: string]: number } = componentEntityList.reduce(
				(obj, com, ind) => ({ ...obj, [com]: ind ** 2 }),
				{},
			);

			const systemList = systems
				.map((system) => ({
					system,
					// Assign system by component points order
					points: system.components.reduce(
						(points, component) => componentMapPoint[component] + points,
						0,
					),
				}))
				.filter((system) => !isNaN(system.points))
				.sort((systemA, systemB) =>
					systemB.points > systemA.points ? 1 : systemB.points === systemA.points ? 0 : -1
				)
				.map(({ system }) => system);

			for await (const system of systemList) {
				try {
					await system?.onRemove?.(entity.id!);
				} catch (e) {
					console.warn(
						`Error catch system::${system.id} "onRemove(${entity.id})"`,
					);
					console.error(e);
				}
				const systemEntities = systemEntitiesMap[system.id];
				systemEntitiesMap[system.id] = systemEntities?.filter((_id) => _id !== entity.id) ?? [];
			}

			delete entityList[entity.id!];
			delete entityComponentMap[entity.id!];

			typeEntityMap[entity.type] = typeEntityMap[entity.type].filter(
				(entityId) => entity.id !== entityId,
			);
		}
	};

	const getSystem = (id: number) => systems[id];

	const clear = () => {
		loopRunning = false;

		systems = [];
		entityList = [];
		typeEntityMap = {} as DarkerMap<I, number[]>;
		entityComponentMap = [];
		entityDataMap = [];
		systemEntitiesMap = [];

		queueLow = [];
		queueMedium = [];
		queueHigh = [];
	};

	const load = async ({ ticksPerSecond = 60, onTick: _onTick }: LoadConfig = {}) => {
		ticks = ticksPerSecond;
		onTick = _onTick;
		loopRunning = true;
		loop();

		for await (const system of systems) {
			await system?.onLoad?.();
		}
	};

	const hardReload = async () => {
		for await (const system of [...systems].reverse().filter(Boolean)) {
			const entities = systemEntitiesMap[system.id];
			for await (const entityId of [...entities].reverse()) {
				system?.onRemove && (await system?.onRemove(entityId));
			}

			system?.onDestroy && (await system?.onDestroy());
		}

		for await (const system of [...systems].filter(Boolean)) {
			system?.onLoad && (await system?.onLoad());

			const entities = systemEntitiesMap[system.id];
			for await (const entityId of [...entities]) {
				system?.onAdd && (await system?.onAdd(entityId));
			}
		}
	};

	const debug = () => {
		const swapSystem = async (systemId: number, system: SystemFunction<C>) => {
			const currentSystem = systems[systemId];
			const entities = systemEntitiesMap[systemId];

			// Remove current entities from system
			if (currentSystem.onRemove) {
				for await (const entityId of [...entities].reverse()) {
					await currentSystem.onRemove(entityId);
				}
			}
			// Destroy current system
			if (currentSystem.onDestroy) await currentSystem.onDestroy();

			const swappedSystem = (await system()) as SystemType<C>;
			swappedSystem.id = currentSystem.id;
			swappedSystem.name = currentSystem.name;
			systems[systemId] = swappedSystem;

			// Load current system
			if (currentSystem?.onLoad) await swappedSystem.onLoad?.();
			// Add current entities to swapped system
			if (currentSystem.onAdd) {
				for await (const entityId of [...entities]) {
					await swappedSystem.onAdd?.(entityId);
				}
			}
		};

		const getSystem = (name: string): SystemType<C> | undefined =>
			Object.values(systems).find((system) => system.name === name);

		return {
			swapSystem,
			getSystem,
		};
	};

	const addActionToQueue = (action: QueueAction<I, C, D>): number => {
		const queues = {
			[Priority.HIGH]: queueHigh,
			[Priority.MEDIUM]: queueMedium,
			[Priority.LOW]: queueLow,
		};

		queues[action.priority || Priority.MEDIUM].push(action);

		return action.id;
	};

	const queueProcessor = async (): Promise<undefined | ActionCompleted> => {
		const queues = [queueHigh, queueMedium, queueLow];
		const queue = queues.find((q) => q.length);
		if (!queue) return undefined;

		const ActionMap = {
			[ActionTypes.ADD_ENTITY]: _processor_addEntity,
			[ActionTypes.REMOVE_ENTITY]: _processor_removeEntity,
			[ActionTypes.UPDATE_COMPONENT]: _processor_entity_updateComponent,
			[ActionTypes.REMOVE_COMPONENT]: _processor_entity_removeComponent,
		};

		const task = queue.shift();
		if (!task) return undefined;

		const action = ActionMap[task.type];
		const result = await action(task.payload as any);

		return {
			id: task.id,
			type: task.type,
			result,
		};
	};

	const loop = async () => {
		if (!loopRunning) return;

		const now = Date.now();
		const deltaTime = now - lastTick;
		const interval = 1000 / ticks;

		let status = undefined;
		if (deltaTime > interval) {
			lastTick = now - (deltaTime % interval);
			status = await queueProcessor();
		}

		if (onTick) onTick(status);
		const nextTick = Math.max(0, interval - (Date.now() - lastTick));
		console.log({ lastTick, deltaTime, interval, next: nextTick });
		setTimeout(loop, nextTick);
	};

	return {
		setSystems,
		getEntityList,
		getEntityListByType,
		getEntityListByComponents,
		getEntity,
		addEntity,
		removeEntity,
		getSystem,

		clear,

		load,
		hardReload,

		__debug__: debug(),
	};
};
