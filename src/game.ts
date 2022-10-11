import {EntityType, GameFunction, SystemFunction, SystemType, UpdateComponentFunctionType} from "./types";
import {uid} from "./uid";

export const game: GameFunction = () => {
    let systems: SystemType[] = [];
    let entityList: Record<number, EntityType> = {};
    let typeEntityMap: Record<number, number[]> = {};
    let entityComponentMap: Record<number, string[]> = {};
    // Contains which components/data has every entity
    let entityDataMap = new Map<number, any>();
    // Contains which entities has every system
    let systemEntitiesMap = new Map<string, number[]>();
    let isLoad: boolean = false;

    let loadListenerList = [];
    let destroyListenerList = [];
    
    const { getUID } = uid()

    // Gets the entity list from current system
    const _system_getEntityList = (systemId: string) => [...systemEntitiesMap.get(systemId)];
    
    const _addEntityToMaps = (component: string, entity: EntityType) => {
        if(!entityComponentMap[entity.id])
            entityComponentMap[entity.id] = [];
        entityComponentMap[entity.id].push(component);

        if(!typeEntityMap[entity.type])
            typeEntityMap[entity.type] = [];
        typeEntityMap[entity.type].push(entity.id);
    }

    const setSystems = (..._systems: SystemFunction[]) => {
        systemEntitiesMap = new Map<string, number[]>();
        systems = _systems.map(system => {
            let systemId = `SYSTEM_${getUID()}`
            const _system = system({
                getEntityList: () => _system_getEntityList(systemId),
            });
            // Sets id if declared
            if(_system.id)
                systemId = _system.id;
            _system.id = systemId;

            systemEntitiesMap.set(systemId, []);

            return _system;
        });
    }

    const _entity_removeComponent = (entityId: number, component: string) => {

        const entity = getEntity(entityId);
        entityComponentMap[entityId] = entityComponentMap[entityId].filter(_component => _component !== component);

        systems
            .filter(system => systemEntitiesMap.get(system.id).includes(entityId))
            .filter(system => !system.components.every(_component => entityComponentMap[entityId]?.includes(_component)))
            .reverse()
            .forEach(system => {
                systemEntitiesMap.set(system.id, systemEntitiesMap.get(system.id).filter(_id => _id !== entityId));
                try {
                    system.onRemove && system.onRemove(entityId);
                } catch (e) {
                    console.warn(`Error catch system::${system.id} "onRemove(${entityId})"`);
                    console.error(e);
                }
            });
    
        // call the listeners
        entity._removeListenerList.filter(c => c).forEach(callback => callback(component));
        
        return entity;
    }

    const _entity_updateComponent = (entityId: number, component: string, data: any = {}) => {

        const entity = getEntity(entityId);
        if(!entityComponentMap[entityId]?.includes(component))
            return _entity_addComponent(entityId, component, data);

        const currentData = entityDataMap.get(entity.id);
        entityDataMap.set(entity.id, {
            ...currentData,
            [component as any]: {...(currentData[component] || {}), ...data}
        });

        systems
            //Only filters the current updated component
            .filter(system => system.components.includes(component))
            .filter(system => systemEntitiesMap.get(system.id).includes(entityId))
            .forEach(system => {
                try {
                    system.onUpdate && system.onUpdate(entityId, component)
                } catch (e) {
                    console.warn(`Error catch system::${system.id} "onUpdate(${entityId}, ${component})"`);
                    console.error(e);
                }
            });
        
        // call the listeners
        entity._updateListenerList.filter(c => c).forEach(callback => callback(component, data));

        return entity;
    }

    const _entity_addComponent = (entityId: number, component: string, data: any = {}) => {
        const entity = getEntity(entityId);
    
        _addEntityToMaps(component, entity);
        entityDataMap.set(entity.id, {
            ...entityDataMap.get(entity.id),
            [component as any]: data
        });

        systems
            .filter(system => system.components.includes(component))
            // Cuando los sistemas no contengan la entidad actual
            .filter(system => !systemEntitiesMap.get(system.id).includes(entityId))
            // Cuando la entidad tenga los componentes correspondientes a ese sistema
            .filter(system => system.components.every(_component => entityComponentMap[entityId]?.includes(_component)))
            .forEach(system => {
                systemEntitiesMap.set(system.id, [...systemEntitiesMap.get(system.id), entityId]);
                try {
                    system?.onAdd && system.onAdd(entityId);
                } catch (e) {
                    console.warn(`Error catch system::${system.id} "onAdd(${entityId})"`);
                    console.error(e);
                }
            });
        return entity;
    }
    
    //TODO maintain original order, not this shit
    const _entity_getComponents = (entityId: number) => entityComponentMap[entityId];

    const _entity_getComponent = (entityId: number, component: any, deepClone: boolean = false) => {
        const entityData = entityDataMap.get(entityId);
        return entityData && entityData[component]
            ? (
                deepClone
                    ? JSON.parse(JSON.stringify(entityData[component]))
                    : {...entityData[component]}
            ) : {};
    }

    const _entity_hasComponent = (entityId: number, component: any) =>
        entityComponentMap[entityId]?.includes(component);

    const _entity_getData = (entityId: number) =>
        JSON.parse(JSON.stringify(entityDataMap.get(entityId)));

    const getEntityList = (): EntityType[] => Object.values(entityList);

    const getEntityListByType = (type: number): EntityType[] => typeEntityMap[type]?.map(entityId => entityList[entityId]) || []

    const getEntityListByComponents = (...componentList: string[]): EntityType[] => {
        const entityIdList = Object.keys(entityComponentMap);
        return Object.values(entityComponentMap).reduce((entityList, entityComponents, index) => [
            ...entityList,
            componentList.every((component) => entityComponents.includes(component)) ? entityList[entityIdList[index]] : undefined
        ], []).filter(e => e !== undefined);
    }

    const getEntity = (entityId: number) => entityList[entityId];

    const addEntity = (...entities: EntityType[]): EntityType[] => {
        const date = Date.now();
        entities.forEach(entity => {
            entity.getData = () => _entity_getData(entity.id);
            entity.getComponent = (component, deepClone) => _entity_getComponent(entity.id, component, deepClone);
            entity.getComponents = () => _entity_getComponents(entity.id);
            entity.hasComponent = (component) => _entity_hasComponent(entity.id, component);
            entity.removeComponent = (component) => _entity_removeComponent(entity.id, component);
            entity.updateComponent = ((component, data) => _entity_updateComponent(entity.id, component, data));

            // listeners
            entity._updateListenerList = [];
            entity._removeListenerList = [];
            entity.addUpdateComponentListener = (callback: UpdateComponentFunctionType) =>
                entity._updateListenerList.push(callback);
            entity.addRemoveComponentListener = (callback: UpdateComponentFunctionType) =>
                entity._updateListenerList.push(callback);
            entity.removeUpdateComponentListener = (id: number) =>
                entity._updateListenerList = entity._updateListenerList.filter((_, index) => id !== index);
            entity.removeRemoveComponentListener = (id: number) =>
                entity._removeListenerList = entity._removeListenerList.filter((_, index) => id !== index);

            //shortcuts
            entity.actions = {};
            Object.keys(entity.shortcuts || {})
                .forEach(key => entity.actions[key] = (data) => entity.shortcuts[key](entity, data))
    
            entity.components.forEach(component => _addEntityToMaps(component, entity))
            entityDataMap.set(entity.id, entity.getComponents().reduce((a, b) => ({
                ...a,
                [b as any]: a[b] || {}
            }), entity.data));

            entityList[entity.id] = entity;
        })
        entities.forEach(entity => {

            // Calculate points from component order.
            const componentMapPoint = entity.components.reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
            systems
                .map(system => ({
                    system,
                    // Assign system by component points order
                    points: system.components.reduce((points, component) => componentMapPoint[component] + points, 0)
                }))
                .filter(system => !isNaN(system.points))
                .sort((systemA, systemB) =>
                    systemB.points > systemA.points ? -1 : (systemB.points === systemA.points ? 0 : 1))
                .map(({ system }) => system)
                .forEach(system => {
                    systemEntitiesMap.set(system.id, [...systemEntitiesMap.get(system.id), entity.id]);
                    try {
                        system?.onAdd && system.onAdd(entity.id);
                    } catch (e) {
                        console.warn(`Error catch system::${system.id} "onUpdate(${entity.id})"`);
                        console.error(e);
                    }
                });
        });
        const ms = Date.now() - date;
        if(ms > 500)
            console.warn(`addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${Object.keys(entityList).length}`)
        return entities;
    };

    const removeEntity = (...entityIdList: number[]) => {
        const _entityList = entityIdList.map(entityId => entityList[entityId]);
        _entityList.map(entity => {
            if(!entity) return;
            const componentEntityList = entity.getComponents();
            // Calculate points from component order.
            const componentMapPoint = componentEntityList.reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
            systems
                .map(system => ({
                    system,
                    // Assign system by component points order
                    points: system.components.reduce((points, component) => componentMapPoint[component] + points, 0)
                }))
                .filter(system => !isNaN(system.points))
                .sort((systemA, systemB) =>
                    systemB.points > systemA.points ? 1 : (systemB.points === systemA.points ? 0 : -1))
                .map(({ system }) => system)
                .forEach(system => {
                    try {
                        system.onRemove && system.onRemove(entity.id);
                    } catch (e) {
                        console.warn(`Error catch system::${system.id} "onRemove(${entity.id})"`);
                        console.error(e);
                    }
                    systemEntitiesMap.set(system.id, systemEntitiesMap.get(system.id).filter(_id => _id !== entity.id));
                });
            delete entityList[entity.id];

            delete entityComponentMap[entity.id];

            typeEntityMap[entity.type] = typeEntityMap[entity.type].filter(entityId => entity.id !== entityId);
        });
    };

    const getSystem = (name: string) => systems.find(system => system.id === name);

    const clear = () => {
        loadListenerList = [];
        destroyListenerList = [];
        entityList = {};
        entityDataMap = new Map<number, any>();
        systemEntitiesMap = new Map<string, number[]>();
    }

    const load = () => {
        loadListenerList.forEach(callback => callback());
        isLoad = true;
    }
    const onLoad = (callback: () => any) => {
        loadListenerList.push(callback);
        if(isLoad) callback();
    }

    const destroy = () => {
        destroyListenerList.forEach(callback => callback());
        isLoad = false;
        removeEntity(...Object.values(entityList).map(entity => entity.id).reverse());
        clear();
    }
    const onDestroy = (callback: () => any) => {
        destroyListenerList.push(callback);
    }
    
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
        onLoad,

        destroy,
        onDestroy,
    
        getUID
    }
}
