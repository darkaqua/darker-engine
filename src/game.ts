import {EntityType, GameFunction, SystemFunction, SystemType, UpdateComponentFunctionType} from "./types";

export const game: GameFunction = () => {
    const systems: SystemType[] = [];
    let entityList: Record<string, EntityType> = {};
    // Contains which components/data has every entity
    const entityDataMap = new Map<string, any>();
    // Contains which entities has every system
    const systemEntitiesMap = new Map<string, string[]>();
    let isLoad: boolean = false;
    const loadListenerList = [];

    // Gets the entity list from current system
    const _system_getEntityList = (systemId: string) => systemEntitiesMap.get(systemId);
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
        const systemList = _systems.map(system => {
            let systemId = `SYSTEM_${Date.now()}_${Math.trunc(Math.random() * 1000)}`
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
        systems.push(...systemList);
    }

    const _entity_removeComponent = (entityId: string, component: any) => {
        const entity = getEntity(entityId);
        entity.components = entity.components.filter(_component => component !== _component);

        systems
            .filter(system => systemEntitiesMap.get(system._id).includes(entityId))
            .filter(system => !system.components.every(_component => entity.components.includes(_component)))
            .reverse()
            .forEach(system => {
                systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => entityId !== entityId));
                system.onRemove && system.onRemove(entityId);
            });
    
        // call the listeners
        entity._removeListenerList.filter(c => c).forEach(callback => callback(component));
        
        return entity;
    }

    const _entity_updateComponent = (entityId: string, component: any, data: any = {}) => {
        const entity = getEntity(entityId);
        if(!entity.components.includes(component))
            return _entity_addComponent(entityId, component, data);

        const currentData = entityDataMap.get(entity.id);
        entityDataMap.set(entity.id, {
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

        entity.components.push(component);
        entityDataMap.set(entity.id, {
            ...entityDataMap.get(entity.id),
            [component as any]: data
        });

        systems
            .filter(system => system.components.includes(component))
            // Cuando los sistemas no contengan la entidad actual
            .filter(system => !systemEntitiesMap.get(system._id).includes(entityId))
            // Cuando la entidad tenga los componentes correspondientes a ese sistema
            .filter(system => system.components.every(_component => entity.components.includes(_component)))
            .forEach(system => {
                systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entityId]);
                system?.onAdd && system.onAdd(entityId);
            });
        return entity;
    }

    const _entity_getComponent = (entityId: string, component: any) => {
        const entityData = entityDataMap.get(entityId);
        return entityData && entityData[component]
            ? JSON.parse(JSON.stringify(entityData[component])) : {};
    }

    const _entity_hasComponent = (entityId: string, component: any) =>
        getEntity(entityId).components.includes(component);

    const _entity_getData = (entityId: string) =>
        JSON.parse(JSON.stringify(entityDataMap.get(entityId)));

    const getEntityList = (): EntityType[] => Object.values(entityList);
    const getEntity = (entityId: string) => entityList[entityId];

    const addEntity = (...entities: EntityType[]): EntityType[] => {
        const date = Date.now();
        entities.forEach(entity => {
            entity.getData = () => _entity_getData(entity.id);
            entity.getComponent = (component) => _entity_getComponent(entity.id, component);
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

            entityDataMap.set(entity.id, entity.components.reduce((a, b) => ({
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
                    systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entity.id]);
                    system.onAdd && system.onAdd(entity.id);
                });
        });
        const ms = Date.now() - date;
        if(ms > 500)
            console.warn(`addEntity ${ms}ms addedEntities:${entities.length} totalEntities:${Object.keys(entityList).length}`)
        return entities;
    };

    const removeEntity = (...entityIdList: string[]) => {
        const _entityList = entityIdList.map(entityId => entityList[entityId]);
        _entityList.forEach(entity => {
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
                    systemB.points > systemA.points ? 1 : (systemB.points === systemA.points ? 0 : -1))
                .map(({ system }) => system)
                .forEach(system => {
                    system.onRemove && system.onRemove(entity.id);
                    systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => _id !== entity.id));
                });
            delete entityList[entity.id];
        });
    };

    const getSystem = (name: string) => systems.find(system => system._id === name);

    const load = () => {
        loadListenerList.forEach(callback => callback());
        isLoad = true;
    }
    const onLoad = (callback: () => any) => {
        loadListenerList.push(callback);
        if(isLoad) callback();
    }
    
    return {
        setSystems,
        getEntityList,
        getEntity,
        addEntity,
        removeEntity,
        getSystem,
        load,
        onLoad
    }
}
