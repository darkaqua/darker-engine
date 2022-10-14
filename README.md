![](https://img.shields.io/github/workflow/status/darkaqua/darker-engine/Tests?label=Tests&style=for-the-badge)
![](https://img.shields.io/github/workflow/status/darkaqua/darker-engine/Publish?label=Build&style=for-the-badge)
![https://www.npmjs.com/package/darker-engine](https://img.shields.io/npm/v/darker-engine?style=for-the-badge)
![](https://img.shields.io/bundlephobia/min/darker-engine?label=BUILD%20SIZE&style=for-the-badge)

# Darker-Engine

Lightweight functional library implementation of the [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system) pattern with typescript.

### Code Example

#### Declaration
```ts
import {game as darkerGame} from "darker-engine";

export const Game = darkerGame();

Game.setSystems(...[]);

Game.load();
```
#### Enums
```ts
enum EntityType {
    EXAMPLE
}

enum Components {
    EXAMPLE_COMPONENT = 'EXAMPLE_COMPONENT'
}
```
#### Entity
```ts
import {EntityType} from "darker-engine";

const exampleEntity = (): EntityType => ({
    id: Game.getUID(),
    type: EntityType.EXAMPLE,
    data: {},
    components: []
});
```
#### Systems
```ts
import {SystemFunction} from "darker-engine";
 
const exampleSystem: SystemFunction = () => {
    
    const onAdd = (entityId: number) => {}
    const onUpdate = (entityId: number, component: string) => {}
    const onRemove = (entityId: number) => {}
    
    return {
        components: [],
        onAdd,
        onUpdate,
        onRemove
    }
}
```

#### Full code
```ts
import {game as darkerGame, SystemFunction, EntityType} from "darker-engine";

export const Game = darkerGame();

enum EntityType {
    EXAMPLE
}

enum Components {
    EXAMPLE_COMPONENT = 'EXAMPLE_COMPONENT'
}

const exampleEntity = (): EntityType => ({
    id: Game.getUID(),
    type: EntityType.EXAMPLE,
    data: {
        [Components.EXAMPLE_COMPONENT]: {
            foo: 'faa'
        }
    },
    components: [
        Components.EXAMPLE_COMPONENT
    ]
});

const exampleSystem: SystemFunction = () => {
    
    let interval;
    
    Game.onLoad(() => {
        console.log('welcome!')
        Game.addEntity(exampleEntity());
    
        interval = setInterval(() => {
            const entityList = Game.getEntityList();
            const entityListByType = Game.getEntityListByType(EntityType.EXAMPLE);
            const entityListByComponents = Game.getEntityListByComponents(Components.EXAMPLE_COMPONENT);
            
            console.log(`Entities`);
            console.log(` - total: ${entityList.length}`);
            console.log(` - type: ${entityListByType.length}`);
            console.log(` - component: ${entityListByComponents.length}`);
        }, 5_000)
    });
    
    Game.onDestroy(() => {
        clearInterval(interval);
        console.log('bye!')
    });
    
    const onAdd = (entityId: number) => {
        const entity = Game.getEntity(id);
        entity.updateComponent(Components.EXAMPLE_COMPONENT, { foo: 'fii' });
    }
    
    const onUpdate = (entityId: number, component: string) => {
        const entity = Game.getEntity(id);
        
        if(component !== Components.EXAMPLE_COMPONENT) return;
        
        const { foo } = entity.getComponent(Components.EXAMPLE_COMPONENT);
        if(foo === 'fii' && !entity.hasComponent('FAKE_COMPONENT'))
            entity.removeComponent(Components.EXAMPLE_COMPONENT);
    }
    
    const onRemove = (entityId: number) => {
        Game.removeEntity(entityId);
    }
    
    return {
        components: [
            Components.EXAMPLE_COMPONENT
        ],
        onAdd,
        onUpdate,
        onRemove
    }
}


Game.setSystems(exampleSystem);
Game.load();

```