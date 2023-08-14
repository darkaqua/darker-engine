import {
	DarkerMap,
	EngineType,
	EntityType,
	SimpleEntityType,
	SystemFunction,
	SystemType,
} from './types.ts';
import { uid } from './uid.ts';

export const engine = <I extends string | number, C extends string | number, D>(): EngineType<
	I,
	C,
	D
> => {
	let systems: SystemType<C>[] = [];
	let entityList: EntityType<I, C, D>[] = [];
	let typeEntityMap: DarkerMap<I, number[]> = {} as DarkerMap<I, number[]>;
	let entityComponentMap: DarkerMap<number, C[]> = {};
	// Contains which components/data has every entity
	let entityDataMap: DarkerMap<number, any> = [];
	// Contains which entities has every system
	let systemEntitiesMap: number[][] = [];

	const { getUID } = uid();

	const setSystems = (..._systems: SystemFunction<C>[]) => {
		systems = [];
		systemEntitiesMap = [];

		_systems.forEach((system) => {
			const _system = system() as SystemType<C>;
			_system.id = _system.id ?? getUID();
			systemEntitiesMap[_system.id] = [];
			systems[_system.id] = _system;
		});
	};

	const _entity_removeComponent = (entityId: number, component: C) => {
		const entity = getEntity(entityId);
		entityComponentMap[entityId] = entityComponentMap[entityId].filter(
			(_component) => _component !== component,
		);

		systems
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return entities?.includes(entityId) ?? false;
			})
			.filter((system) =>
				!system.components.every((_component) => entityComponentMap[entityId]?.includes(_component))
			)
			.reverse()
			.forEach((system) => {
				const entities = systemEntitiesMap[system.id];
				systemEntitiesMap[system.id] = entities?.filter((_id) => _id !== entityId) ??
					[];
				try {
					system?.onRemove?.(entityId);
				} catch (e) {
					console.warn(
						`Error catch system::${system.id} "onRemove(${entityId})"`,
					);
					console.error(e);
				}
			});

		return entity;
	};

	const _entity_updateComponent = (
		entityId: number,
		component: C,
		data: any,
	) => {
		const entity = getEntity(entityId);
		if (!entityComponentMap[entityId]?.includes(component)) {
			return _entity_addComponent(entityId, component, data);
		}

		const currentData = entityDataMap[entity.id];
		entityDataMap[entity.id] = {
			...currentData,
			[component]: { ...(currentData[component] || {}), ...data },
		};

		systems
			//Only filters the current updated component
			.filter((system) => system.components.includes(component))
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return entities?.includes(entityId) ?? false;
			})
			.forEach((system) => {
				try {
					system?.onUpdate?.(entityId, component);
				} catch (e) {
					console.warn(
						`Error catch system::${system.id} "onUpdate(${entityId}, ${component})"`,
					);
					console.error(e);
				}
			});

		return entity;
	};

	const _entity_addComponent = (
		entityId: number,
		component: C,
		data = {},
	) => {
		const entity = getEntity(entityId);

		entityComponentMap[entity.id].push(component);
		entityDataMap[entity.id] = {
			...entityDataMap[entity.id],
			[component]: data,
		};

		systems
			.filter((system) => system.components.includes(component))
			// Cuando los sistemas no contengan la entidad actual
			.filter((system) => {
				const entities = systemEntitiesMap[system.id];
				return !entities?.includes(entityId) ?? true;
			})
			// Cuando la entidad tenga los componentes correspondientes a ese sistema
			.filter((system) =>
				system.components.every((_component) => entityComponentMap[entityId]?.includes(_component))
			)
			.forEach((system) => {
				const entities = systemEntitiesMap[system.id];
				systemEntitiesMap[system.id] = [...(entities ?? []), entityId];
				try {
					system?.onAdd?.(entityId);
				} catch (e) {
					console.warn(`Error catch system::${system.id} "onAdd(${entityId})"`);
					console.error(e);
				}
			});
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
			? (
				deepClone ? structuredClone(entityData[component]) : { ...entityData[component] }
			)
			: {};
	};

	const _entity_getComponents = <T extends keyof D>(
		entityId: number,
		components: T[],
		deepClone = false,
	): { [K in T]: D[K] } => {
		const entityData = entityDataMap[entityId];

		return components.reduce((acc, component) => {
			const data = entityData[component];
			if (!data) return acc;

			acc[component] = deepClone ? structuredClone(data) : data;
			return acc;
		}, {} as { [K in T]: D[K] });
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
		return entityList.reduce((list, entity) => {
			const entityComponents = entityComponentMap[entity.id];
			if (
				componentList.length === 0 ||
				componentList.every((component) => entityComponents.includes(component))
			) {
				return [
					...list,
					entity,
				];
			}

			return list;
		}, Array<EntityType<I, C, D>>()).filter(Boolean);
	};

	const getEntity = (entityId: number) => entityList[entityId];

	const addEntity = (...rawEntities: SimpleEntityType<I, C, D>[]): EntityType<I, C, D>[] => {
		const date = Date.now();
		const entities = rawEntities.map((rawEntity) => {
			const entity = rawEntity as EntityType<I, C, D>;
			entity.id = entity.id ?? getUID();
			entity.getData = () => _entity_getData(entity.id);
			entity.getComponent = (component, deepClone) =>
				_entity_getComponent(entity.id, component, deepClone);
			entity.getComponentTypes = () => _entity_getComponentTypes(entity.id);
			entity.getComponents = (components, deepClone) =>
				_entity_getComponents(entity.id, components, deepClone);
			entity.hasComponent = (component) => _entity_hasComponent(entity.id, component);
			entity.removeComponent = (component) => _entity_removeComponent(entity.id, component);
			entity.updateComponent = (component, data) =>
				_entity_updateComponent(entity.id, component as unknown as C, data);

			if (!typeEntityMap[entity.type]) {
				typeEntityMap[entity.type] = [];
			}
			typeEntityMap[entity.type].push(entity.id);

			entityComponentMap[entity.id] = entity.components;

			entityDataMap[entity.id] = entity?.getComponentTypes?.().reduce((acc, b) => ({
				...acc,
				[b]: (acc as any)[b] || {},
			}), entity.data) ?? {};
			entityList[entity.id] = entity;
			return entity;
		});

		entities.forEach((entity) => {
			// Calculate points from component order.
			const componentMapPoint: { [key: string]: number } = entity.components
				.reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
			systems
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
					systemB.points > systemA.points ? -1 : (systemB.points === systemA.points ? 0 : 1)
				)
				.map(({ system }) => system)
				.forEach((system) => {
					const systemEntities = systemEntitiesMap[system.id];
					systemEntitiesMap[system.id] = [
						...(systemEntities ?? []),
						entity.id,
					];
					try {
						system?.onAdd?.(entity.id);
					} catch (e) {
						console.warn(
							`Error catch system::${system.id} "onUpdate(${entity.id})"`,
						);
						console.error(e);
					}
				});
		});
		const ms = Date.now() - date;
		if (ms > 500) {
			console.warn(
				`addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${entityList.length}`,
			);
		}
		return entities;
	};

	const removeEntity = (...entityIdList: number[]) => {
		const _entityList = entityIdList.map((entityId) => entityList[entityId]);
		_entityList.map((entity) => {
			if (!entity) return;
			const componentEntityList = entity?.getComponentTypes?.();
			if (!componentEntityList) return;

			// Calculate points from component order.
			const componentMapPoint: { [key: string]: number } = componentEntityList
				.reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
			systems
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
					systemB.points > systemA.points ? 1 : (systemB.points === systemA.points ? 0 : -1)
				)
				.map(({ system }) => system)
				.forEach((system) => {
					try {
						system?.onRemove?.(entity.id);
					} catch (e) {
						console.warn(
							`Error catch system::${system.id} "onRemove(${entity.id})"`,
						);
						console.error(e);
					}
					const systemEntities = systemEntitiesMap[system.id];
					systemEntitiesMap[system.id] = systemEntities?.filter((_id) => _id !== entity.id) ?? [];
				});
			delete entityList[entity.id];

			delete entityComponentMap[entity.id];

			typeEntityMap[entity.type] = typeEntityMap[entity.type].filter(
				(entityId) => entity.id !== entityId,
			);
		});
	};

	const getSystem = (id: number) => systems[id];

	const clear = () => {
		systems = [];
		entityList = [];
		typeEntityMap = {} as DarkerMap<I, number[]>;
		entityComponentMap = [];
		entityDataMap = [];
		systemEntitiesMap = [];
	};

	const load = () => {
		systems.forEach((system) => system?.onLoad?.());
	};

	const destroy = () => {
		systems.forEach((system) => system?.onDestroy?.());
		removeEntity(
			...Object.values(entityList).map((entity) => entity.id).reverse(),
		);
		clear();
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
		destroy,

		getUID,
	};
};
