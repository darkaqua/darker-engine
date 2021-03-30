import {entitiesFunction} from "./entities";
import {GameFunction, SystemType} from "./types";

export const game: GameFunction = <SystemEnum, ComponentEnum>() => {
    let systems: SystemType<SystemEnum, ComponentEnum>[] = [];
    // Contains which components has every entity
    const entityComponentMap = new Map<string, ComponentEnum[]>();
    // Contains which entities has every system
    const systemEntitiesMap = new Map<SystemEnum, string[]>();

    const setSystems = (..._systems: SystemType<SystemEnum, ComponentEnum>[]) => {
        _systems.forEach(system => {
            systemEntitiesMap.set(system.id, []);
        });
        systems.push(..._systems);
    }

    const entities = entitiesFunction<ComponentEnum>();

    const onAddComponent = (id: string) => {
        const components = entityComponentMap.get(id) || [];
        systems
            .filter(system => systemEntitiesMap.get(system.id).indexOf(id) === -1)
            .filter(system => system.components.every(_component => components.indexOf(_component) > -1))
            .forEach(system => {
                systemEntitiesMap.set(system.id, [...systemEntitiesMap.get(system.id), id]);
                system.onAdd(id);
            });
    }

    const onRemoveComponent = (id: string) => {
        const components = entityComponentMap.get(id) || [];
        systems
            .filter(system => systemEntitiesMap.get(system.id).indexOf(id) > -1)
            .filter(system => !system.components.every(_component => components.indexOf(_component) > -1))
            .forEach(system => {
                systemEntitiesMap.set(system.id, systemEntitiesMap.get(system.id).filter(_id => id !== id));
                system.onRemove(id);
            });
    }

    const onLoop = (delta: number) => {
        const entityList = entities.getList();
        entityList.forEach(({ id, components }) => {
            const currentComponents = (): ComponentEnum[] => entityComponentMap.get(id) || [];

            // added components
            components
                .filter(component => currentComponents().indexOf(component) === -1)
                .forEach(component => {
                    entityComponentMap.set(id, [...currentComponents(), component]);
                    onAddComponent(id);
                });

            // removed components
            currentComponents()
                .filter(component => components.indexOf(component) === -1)
                .forEach(component => {
                    entityComponentMap.set(id, currentComponents().filter(c => c !== component));
                    onRemoveComponent(id);
                });
        });
        systems.forEach(system => system?.onLoop && system.onLoop(delta));
    }

    const getSystemEntities = (system: SystemEnum) => systemEntitiesMap.get(system);

    return {
        entities,
        onLoop,
        setSystems,
        getSystemEntities
    }
}
