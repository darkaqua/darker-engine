import {EntityType, GameFunction, SystemFunction, SystemType, UpdateComponentFunctionType} from "./types";
import {v4} from 'uuid';

export const game: GameFunction = () => {
    let systems: SystemType[] = [];
    let entityList: Record<string, EntityType> = {};
    let componentEntityMap: Record<string, string[]> = {};
    // Contains which components/data has every entity
    let entityDataMap = new Map<string, any>();
    // Contains which entities has every system
    let systemEntitiesMap = new Map<string, string[]>();
    let isLoad: boolean = false;

    let loadListenerList = [];
    let destroyListenerList = [];

    // Gets the entity list from current system
    const _system_getEntityList = (systemId: string) => [...systemEntitiesMap.get(systemId)];
    // Gets the data from current system
    // const _system_getData = (systemId: string): any =>
    //     systems.find(_system => _system._id === systemId)._data;
    // Updates the data from current system
    // const _system_updateData = (systemId: string, data: any) => {
    //     const system = systems.find(_system => _system._id === systemId);
    //     system._data = !data ? data : { ...system._data, ...data };
    //     // call callback subscriptions
    //     system._dataListenerList
    //         .filter((value) => !!value)
    //         .forEach((value) => value(system._data));
    //
    //     if(system.onDataUpdate) system.onDataUpdate(data);
    // }
    // const _system_addDataListener = (systemId: string, callback: any): number => {
    //     const system = systems.find(_system => _system._id === systemId);
    //     return system._dataListenerList.push(callback) - 1;
    // }
    // const _system_removeDataListener = (systemId: string, index: number) => {
    //     const system = systems.find(_system => _system._id === systemId);
    //     return system._dataListenerList[index] = null;
    // }

    const setSystems = (..._systems: SystemFunction[]) => {
        systemEntitiesMap = new Map<string, string[]>();
        systems = _systems.map(system => {
            let systemId = `SYSTEM_${v4()}`
            const _system = system({
                getEntityList: () => _system_getEntityList(systemId),
                // getData: () => _system_getData(systemId),
                // updateData: (data: any) => _system_updateData(systemId, data)
            });
            // Sets id if declared
            if(_system._id)
                systemId = _system._id;
            _system._id = systemId;

            //data things
            // _system._data = {};
            // _system.getData = () => _system_getData(systemId);
            // _system.updateData = (data: any) => _system_updateData(systemId, data);
            //
            // _system._dataListenerList = [];
            // _system.addDataListener = (callback: any): number => _system_addDataListener(systemId, callback);
            // _system.removeDataListener = (index: number) => _system_removeDataListener(systemId, index);

            systemEntitiesMap.set(systemId, []);

            return _system;
        });
    }

    const _entity_removeComponent = (entityId: string, component: any) => {

        const entity = getEntity(entityId);
        componentEntityMap[component] = componentEntityMap[component].filter(_entityId => entityId !== _entityId);

        systems
            .filter(system => systemEntitiesMap.get(system._id).includes(entityId))
            .filter(system => !system.components.every(_component => componentEntityMap[component].includes(entityId)))
            .reverse()
            .forEach(system => {
                systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => _id !== entityId));
                system.onRemove && system.onRemove(entityId);
            });
    
        // call the listeners
        entity._removeListenerList.filter(c => c).forEach(callback => callback(component));
        
        return entity;
    }

    const _entity_updateComponent = (entityId: string, component: any, data: any = {}) => {

        const entity = getEntity(entityId);
        if(!componentEntityMap[component].includes(entityId))
            return _entity_addComponent(entityId, component, data);

        const currentData = entityDataMap.get(entity._id);
        entityDataMap.set(entity._id, {
            ...currentData,
            [component as any]: {...(currentData[component] || {}), ...data}
        });

        systems
            //Only filters the current updated component
            .filter(system => system.components.includes(component))
            .filter(system => systemEntitiesMap.get(system._id).includes(entityId))
            .forEach(system => system.onUpdate && system.onUpdate(entityId, component));
        
        // call the listeners
        entity._updateListenerList.filter(c => c).forEach(callback => callback(component, data));

        return entity;
    }

    const _entity_addComponent = (entityId: string, component: any, data: any = {}) => {
        const entity = getEntity(entityId);
    
        componentEntityMap[component].push(entityId)
        entityDataMap.set(entity._id, {
            ...entityDataMap.get(entity._id),
            [component as any]: data
        });

        systems
            .filter(system => system.components.includes(component))
            // Cuando los sistemas no contengan la entidad actual
            .filter(system => !systemEntitiesMap.get(system._id).includes(entityId))
            // Cuando la entidad tenga los componentes correspondientes a ese sistema
            .filter(system => system.components.every(_component => componentEntityMap[component].includes(entityId)))
            .forEach(system => {
                systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entityId]);
                system?.onAdd && system.onAdd(entityId);
            });
        return entity;
    }
    
    const _entity_getComponents = (entityId: string) =>
        Object.keys(componentEntityMap).reduce((componentList, component) => {
            if(componentEntityMap[component].includes(entityId))
                componentList.push(component)
            return componentList;
        }, []);

    const _entity_getComponent = (entityId: string, component: any, deepClone: boolean = false) => {
        const entityData = entityDataMap.get(entityId);
        return entityData && entityData[component]
            ? (
                deepClone
                    ? JSON.parse(JSON.stringify(entityData[component]))
                    : {...entityData[component]}
            ) : {};
    }

    const _entity_hasComponent = (entityId: string, component: any) =>
        componentEntityMap[component].includes(entityId);

    const _entity_getData = (entityId: string) =>
        JSON.parse(JSON.stringify(entityDataMap.get(entityId)));

    const getEntityList = (...component: any[]): EntityType[] => {
        return Object.values(entityList);
    }
    const getEntity = (entityId: string) => entityList[entityId];

    const addEntity = (...entities: EntityType[]): EntityType[] => {
        const date = Date.now();
        entities.forEach(entity => {
            entity.getData = () => _entity_getData(entity._id);
            entity.getComponent = (component, deepClone) => _entity_getComponent(entity._id, component, deepClone);
            entity.getComponents = () => _entity_getComponents(entity._id);
            entity.hasComponent = (component) => _entity_hasComponent(entity._id, component);
            entity.removeComponent = (component) => _entity_removeComponent(entity._id, component);
            entity.updateComponent = ((component, data) => _entity_updateComponent(entity._id, component, data));

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
            entity._shortcuts = entity._shortcuts || {};
            entity.actions = {};
            Object.keys(entity._shortcuts)
                .forEach(key => entity.actions[key] = (data) => entity._shortcuts[key](entity, data))
    
            entity._components.forEach(component => componentEntityMap[component].push(entity._id))
            entityDataMap.set(entity._id, entity.getComponents().reduce((a, b) => ({
                ...a,
                [b as any]: a[b] || {}
            }), entity._data));

            entityList[entity._id] = entity;
        })
        entities.forEach(entity => {

            // Calculate points from component order.
            const componentMapPoint = entity._components.reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
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
                    systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entity._id]);
                    system.onAdd && system.onAdd(entity._id);
                });
        });
        const ms = Date.now() - date;
        if(ms > 500)
            console.warn(`addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${Object.keys(entityList).length}`)
        return entities;
    };

    const removeEntity = (...entityIdList: string[]) => {
        const _entityList = entityIdList.map(entityId => entityList[entityId]);
        _entityList.map(entity => {
            if(!entity) return;
            // Calculate points from component order.
            const componentMapPoint = entity.getComponents().reduce((obj, com, ind) => ({ ...obj, [com]: ind ** 2 }), {});
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
                    system.onRemove && system.onRemove(entity._id);
                    systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => _id !== entity._id));
                });
            delete entityList[entity._id];
        });
    };

    const getSystem = (name: string) => systems.find(system => system._id === name);

    const clear = () => {
        loadListenerList = [];
        destroyListenerList = [];
        entityList = {};
        entityDataMap = new Map<string, any>();
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
        removeEntity(...Object.keys(entityList).reverse());
        clear();
    }
    const onDestroy = (callback: () => any) => {
        destroyListenerList.push(callback);
    }
    
    return {
        setSystems,
        getEntityList,
        getEntity,
        addEntity,
        removeEntity,
        getSystem,

        clear,

        load,
        onLoad,

        destroy,
        onDestroy
    }
}
