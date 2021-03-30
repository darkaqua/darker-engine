import {EntitiesFunction, EntityType} from "./types";

export const entitiesFunction: EntitiesFunction = <ComponentEnum>() => {
    let entityList: EntityType<ComponentEnum>[] = [];
    const entityDataMap = new Map<string, any>();

    const getList = (): EntityType<ComponentEnum>[] => [...entityList];

    const get = (id: string) => getList().find(entity => entity.id === id);
    const add = (...entities: EntityType<ComponentEnum>[]) => entityList.push(
        ...entities.map(entity => {
            entity.getData = () => JSON.parse(JSON.stringify(entityDataMap.get(entity.id)));
            entity.getComponent = (component) => JSON.parse(JSON.stringify(entityDataMap.get(entity.id)[component]));
            entity.addComponent = (component) => addComponent(entity.id, component);
            entity.removeComponent = (component) => removeComponent(entity.id, component);
            entity.updateComponent = ((component, data) => updateComponent(entity.id, component, data));

            entityDataMap.set(entity.id, entity.components.reduce((a, b) => ({...a, [b as any]: {}}), {}));
            return entity;
        })
    );
    const remove = (id: string) => entityList = getList().filter(entity => entity.id !== id);

    const addComponent = (id: string, component: ComponentEnum, data: any = {}): EntityType<ComponentEnum> => {
        const entity = get(id);
        entity.components.push(component);
        entityDataMap.set(entity.id, {
            ...entityDataMap.get(entity.id),
            [component as any]: data
        });
        return entity;
    }
    const updateComponent = (id: string, component: ComponentEnum, data: any) => {
        const entity = get(id);
        const currentData = entityDataMap.get(entity.id);
        entityDataMap.set(entity.id, {
            ...currentData,
            [component as any]: {...(currentData[component] || {}), ...data}
        });
        return entity;
    }
    const removeComponent = (id: string, component: ComponentEnum) => {
        const entity = get(id);
        entity.components = entity.components.filter(_component => component !== _component);
        return entity;
    }

    return {
        getList,

        get,
        add,
        remove
    }
}
