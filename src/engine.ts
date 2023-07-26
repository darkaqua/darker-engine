import {
  EngineFunction,
  EntityType,
  SystemFunction,
  SystemType,
} from "./types.ts";
import { uid } from "./uid.ts";

export const engine: EngineFunction = () => {
  let systems: SystemType[] = [];
  let entityList: Record<string, EntityType> = {};
  let typeEntityMap: Record<number, number[]> = {};
  let entityComponentMap: Record<number, string[]> = {};
  // Contains which components/data has every entity
  let entityDataMap = new Map<number, any>();
  // Contains which entities has every system
  let systemEntitiesMap = new Map<string, number[]>();

  const { getUID } = uid();

  const setSystems = (..._systems: SystemFunction[]) => {
    systemEntitiesMap = new Map<string, number[]>();
    systems = _systems.map((system) => {
      let systemId = `SYSTEM_${getUID()}`;
      const _system = system();
      // Sets id if declared
      if (_system.id) {
        systemId = _system.id;
      }
      _system.id = systemId;

      systemEntitiesMap.set(systemId, []);

      return _system;
    });
  };

  const _entity_removeComponent = (entityId: number, component: string) => {
    const entity = getEntity(entityId);
    entityComponentMap[entityId] = entityComponentMap[entityId].filter(
      (_component) => _component !== component,
    );

    systems
      .filter((system) => {
        const entities = systemEntitiesMap.get(system.id);
        return entities?.includes(entityId) ?? false;
      })
      .filter((system) =>
        !system.components.every((_component) =>
          entityComponentMap[entityId]?.includes(_component)
        )
      )
      .reverse()
      .forEach((system) => {
        const entities = systemEntitiesMap.get(system.id);
        const entitiesFiltered = entities?.filter((_id) => _id !== entityId) ??
          [];
        systemEntitiesMap.set(system.id, entitiesFiltered);
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
    component: string,
    data: any = {},
  ) => {
    const entity = getEntity(entityId);
    if (!entityComponentMap[entityId]?.includes(component)) {
      return _entity_addComponent(entityId, component, data);
    }

    const currentData = entityDataMap.get(entity.id);
    entityDataMap.set(entity.id, {
      ...currentData,
      [component]: { ...(currentData[component] || {}), ...data },
    });

    systems
      //Only filters the current updated component
      .filter((system) => system.components.includes(component))
      .filter((system) => {
        const entities = systemEntitiesMap.get(system.id);
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
    component: string,
    data: any = {},
  ) => {
    const entity = getEntity(entityId);

    entityComponentMap[entity.id].push(component);
    entityDataMap.set(entity.id, {
      ...entityDataMap.get(entity.id),
      [component]: data,
    });

    systems
      .filter((system) => system.components.includes(component))
      // Cuando los sistemas no contengan la entidad actual
      .filter((system) => {
        const entities = systemEntitiesMap.get(system.id);
        return !entities?.includes(entityId) ?? true;
      })
      // Cuando la entidad tenga los componentes correspondientes a ese sistema
      .filter((system) =>
        system.components.every((_component) =>
          entityComponentMap[entityId]?.includes(_component)
        )
      )
      .forEach((system) => {
        const entities = systemEntitiesMap.get(system.id);
        systemEntitiesMap.set(system.id, [...(entities ?? []), entityId]);
        try {
          system?.onAdd?.(entityId);
        } catch (e) {
          console.warn(`Error catch system::${system.id} "onAdd(${entityId})"`);
          console.error(e);
        }
      });
    return entity;
  };

  //TODO maintain original order, not this shit
  const _entity_getComponents = (entityId: number) =>
    entityComponentMap[entityId];

  const _entity_getComponent = (
    entityId: number,
    component: any,
    deepClone: boolean = false,
  ) => {
    const entityData = entityDataMap.get(entityId);
    return entityData && entityData[component]
      ? (
        deepClone
          ? structuredClone(entityData[component])
          : { ...entityData[component] }
      )
      : {};
  };

  const _entity_hasComponent = (entityId: number, component: any) =>
    entityComponentMap[entityId]?.includes(component);

  const _entity_getData = (entityId: number) =>
   structuredClone(entityDataMap.get(entityId));

  const getEntityList = (): EntityType[] => Object.values(entityList) || [];

  const getEntityListByType = (type: number): EntityType[] =>
    typeEntityMap[type]?.map((entityId) => entityList[entityId]) || [];

  const getEntityListByComponents = (
    ...componentList: string[]
  ): EntityType[] => {
    const entityIdList = Object.keys(entityComponentMap);
    return Object.values(entityComponentMap).reduce(
      (currentEntityList, entityComponents, index) => {
        if (
          componentList.length === 0 ||
          componentList.every((component) =>
            entityComponents.includes(component)
          )
        ) {
          return [
            ...currentEntityList,
            entityList[entityIdList[index]],
          ];
        }

        return currentEntityList;
      },
      Array<EntityType>(),
    ).filter((e) => e !== undefined);
  };

  const getEntity = (entityId: number) => entityList[entityId];

  const addEntity = (...entities: EntityType[]): EntityType[] => {
    const date = Date.now();
    entities.forEach((entity) => {
      entity.getData = () => _entity_getData(entity.id);
      entity.getComponent = (component, deepClone) =>
        _entity_getComponent(entity.id, component, deepClone);
      entity.getComponents = () => _entity_getComponents(entity.id);
      entity.hasComponent = (component) =>
        _entity_hasComponent(entity.id, component);
      entity.removeComponent = (component) =>
        _entity_removeComponent(entity.id, component);
      entity.updateComponent = (component, data) =>
        _entity_updateComponent(entity.id, component, data);

      //shortcuts
      entity.actions = {};
      Object.keys(entity.shortcuts || {})
        .forEach((key) => {
          if (entity?.actions?.[key]) {
            entity.actions[key] = (data) =>
              entity?.shortcuts?.[key](entity, data);
          }
        });

      if (!typeEntityMap[entity.type]) {
        typeEntityMap[entity.type] = [];
      }
      typeEntityMap[entity.type].push(entity.id);

      entityComponentMap[entity.id] = entity.components;

      const entityData = entity?.getComponents?.().reduce((a, b) => ({
        ...a,
        [b]: a[b] || {},
      }), entity.data) ?? {};

      entityDataMap.set(entity.id, entityData);

      entityList[entity.id] = entity;
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
          systemB.points > systemA.points
            ? -1
            : (systemB.points === systemA.points ? 0 : 1)
        )
        .map(({ system }) => system)
        .forEach((system) => {
          const systemEntities = systemEntitiesMap.get(system.id);
          systemEntitiesMap.set(system.id, [
            ...(systemEntities ?? []),
            entity.id,
          ]);
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
        `addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${
          Object.keys(entityList).length
        }`,
      );
    }
    return entities;
  };

  const removeEntity = (...entityIdList: number[]) => {
    const _entityList = entityIdList.map((entityId) => entityList[entityId]);
    _entityList.map((entity) => {
      if (!entity) return;
      const componentEntityList = entity?.getComponents?.();
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
          systemB.points > systemA.points
            ? 1
            : (systemB.points === systemA.points ? 0 : -1)
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
          const systemEntities = systemEntitiesMap.get(system.id);
          systemEntitiesMap.set(
            system.id,
            systemEntities?.filter((_id) => _id !== entity.id) ?? [],
          );
        });
      delete entityList[entity.id];

      delete entityComponentMap[entity.id];

      typeEntityMap[entity.type] = typeEntityMap[entity.type].filter(
        (entityId) => entity.id !== entityId,
      );
    });
  };

  const getSystem = (name: string) =>
    systems.find((system) => system.id === name);

  const clear = () => {
    entityList = {};
    entityDataMap = new Map<number, any>();
    systemEntitiesMap = new Map<string, number[]>();
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
