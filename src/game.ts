import {EntityType, GameFunction, SystemFunction, SystemType} from "./types";

export const game: GameFunction = () => {
    const systems: SystemType[] = [];
    let entityList: EntityType[] = [];
    // Contains which components/data has every entity
    const entityDataMap = new Map<string, any>();
    // Contains which entities has every system
    const systemEntitiesMap = new Map<string, string[]>();

    const _system_getEntityList = (systemId: string) => systemEntitiesMap.get(systemId);

    const setSystems = (..._systems: SystemFunction[]) => {
        const systemList = _systems.map(system => {
            const systemId = `s_${Date.now()}_${Math.trunc(Math.random() * 1000)}`;
            const _system = system({
                getEntityList: () => _system_getEntityList(systemId)
            });
            _system._id = systemId;
            systemEntitiesMap.set(systemId, []);
            return _system;
        });
        systems.push(...systemList);
    }

    const _entity_addComponent = (entityId: string, component: any, data: any = {}) => {
        const entity = getEntity(entityId);
        if(entity.components.indexOf(component) > -1) return  entity;

        entity.components.push(component);
        entityDataMap.set(entity.id, {
            ...entityDataMap.get(entity.id),
            [component as any]: data
        });

        systems
            .filter(system => systemEntitiesMap.get(system._id).indexOf(entityId) === -1)
            .filter(system => system.components.every(_component => entity.components.indexOf(_component) > -1))
            .forEach(system => {
                systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entityId]);
                system?.onAdd && system.onAdd(entityId);
            });
        return entity;
    }

    const _entity_removeComponent = (entityId: string, component: any) => {
        const entity = getEntity(entityId);
        entity.components = entity.components.filter(_component => component !== _component);

        systems
            .filter(system => systemEntitiesMap.get(system._id).indexOf(entityId) > -1)
            .filter(system => !system.components.every(_component => entity.components.indexOf(_component) > -1))
            .reverse()
            .forEach(system => {
                systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => entityId !== entityId));
                system.onRemove && system.onRemove(entityId);
            });
        return entity;
    }

    const _entity_updateComponent = (entityId: string, component: any, data: any = {}) => {
        const entity = getEntity(entityId);
        if(entity.components.indexOf(component) === -1) return  entity;

        const currentData = entityDataMap.get(entity.id);
        entityDataMap.set(entity.id, {
            ...currentData,
            [component as any]: {...(currentData[component] || {}), ...data}
        });

        systems
            //Only filters the current updated component
            .filter(system => system.components.indexOf(component) > -1)
            .filter(system => systemEntitiesMap.get(system._id).indexOf(entityId) > -1)
            .forEach(system => system.onUpdate && system.onUpdate(entityId, component));

        return entity;
    }

    const _entity_getComponent = (entityId: string, component: any) =>
        JSON.parse(JSON.stringify(entityDataMap.get(entityId)[component]));

    const _entity_hasComponent = (entityId: string, component: any) =>
        getEntity(entityId).components.indexOf(component) > -1;

    const _entity_getData = (entityId: string) =>
        JSON.parse(JSON.stringify(entityDataMap.get(entityId)));

    const getEntityList = (): EntityType[] => [...entityList];
    const getEntity = (entityId: string) => entityList.find(entity => entity.id === entityId);

    const addEntity = (...entities: EntityType[]) => {
        entityList.push(
            ...entities.map(entity => {
                entity.getData = () => _entity_getData(entity.id);
                entity.getComponent = (component) => _entity_getComponent(entity.id, component);
                entity.hasComponent = (component) => _entity_hasComponent(entity.id, component);
                entity.addComponent = (component, data) => _entity_addComponent(entity.id, component, data);
                entity.removeComponent = (component) => _entity_removeComponent(entity.id, component);
                entity.updateComponent = ((component, data) => _entity_updateComponent(entity.id, component, data));

                entityDataMap.set(entity.id, entity.components.reduce((a, b) => ({
                    ...a,
                    [b as any]: a[b] || {}
                }), entity.data));

                return entity;
            })
        );
        entities.forEach(entity => {
            systems
                .filter(system => system.components.every(_component => entity.components.indexOf(_component) > -1))
                .forEach(system => {
                    systemEntitiesMap.set(system._id, [...systemEntitiesMap.get(system._id), entity.id]);
                    system.onAdd && system.onAdd(entity.id);
                });
        })
    };

    const removeEntity = (entityId: string) => {
        systems
            .filter(system => systemEntitiesMap.get(system._id).indexOf(entityId) > -1)
            .reverse()
            .forEach(system => {
                system.onRemove && system.onRemove(entityId);
                systemEntitiesMap.set(system._id, systemEntitiesMap.get(system._id).filter(_id => entityId !== entityId));
            });
        entityList = entityList.filter(entity => entity.id !== entityId);
    };

    return {
        setSystems,
        getEntityList,
        getEntity,
        addEntity,
        removeEntity
    }
}
