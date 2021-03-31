# darker-engine

Lightweight functional library implementaton of the [Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system) pattern with typescript.

## How to start:

Install the lib.

`yarn add darker-engine`

Import the lib:
```Typescript
import {game} from "darker-engine";
```
Declare the system and component enums.
```Typescript
enum SystemEnum {
  SPIDER_SYSTEM
}
enum ComponentEnum {
  SPIDY,
  MOB
}
```
Call the game function, and extract what you need.
- `entities`, can access the... entities.
- `onLoop`, is a function to be call from your [LoopWorker](https://github.com/voidpixel/LoopWorker/packages/399863) or DOM loop.
- `setSystems`, sets the systems of the game.
```Typescript
const {
  entities,
  onLoop,
  setSystems
} = game<SystemEnum, ComponentEnum>();
```
Import the type, if you are cool, and create a function and return:
- `id`, entity unique identificator.
- `components`, array with every `component` you want to assign to the entity.
```Typescript
import {EntityFunction} from "darker-engine";

const spiderEntity: EntityFunction<ComponentEnum> = (
  name: string
) => ({
  id: name,
  components: [
    ComponentEnum.SPIDY,
    ComponentEnum.MOB
  ]
});
```
Create your first system, you need to return some mandatory params:
- `id`, unique for every system, from the enum we created.
- `components`, a list of every component the entity need to activate
- `onAdd`, function that returns an entity addition :)
- `onRemove`, function that returns an entity removal :(
```Typescript
import {SystemFunction} from "darker-engine";

const spiderSystem: SystemFunction<SystemEnum, ComponentEnum> = () => {
  const onAdd = (id: string) => {
    console.log('Spidermaaaaannn!!', id);

    const entity = entities.get(id);
    // We can modify the component data...
    entity.updateComponent(ComponentEnum.SPIDY, {
      deathMessage: 'Mr. Stark? I don't feel so good... I don't wanna go...'
    });

    setTimeout(() => {
      // And also delete one component
      entity.removeComponent(ComponentEnum.SPIDY);
    }, 3000);
  }
  const onRemove = (id: string) => {
    console.log(entities.get(id).getComponent(ComponentEnum.WEB).deathMessage, id);
  }
  return {
    id: SystemEnum.SPIDER_SYSTEM,
    components: [
      ComponentEnum.SPIDY,
      ComponentEnum.MOB
    ],
    onAdd,
    onRemove
  }
}
```
Add the systems and the entities to the game.
```Typescript
setSystems( spiderSystem() );

entities.add( spiderEntity('Tom_Holland') );
```
And don't forget to add your loop!!
```Typescript
import {LoopWorker} from "@voidpixel/loop-worker";

const loopWorker = new LoopWorker({ ticksPerSecond: 20 });
loopWorker.on('tick', (data) => onLoop(data.ms));
```


## Complete example code
```Typescript
import {game, EntityFunction, SystemFunction} from "darker-engine";
import {LoopWorker} from "@voidpixel/loop-worker";

enum SystemEnum {
  SPIDER_SYSTEM
}
enum ComponentEnum {
  SPIDY,
  MOB
}

const {
  entities,
  onLoop,
  setSystems
} = game<SystemEnum, ComponentEnum>();

const spiderEntity: EntityFunction<ComponentEnum> = (
  name: string
) => ({
  id: name,
  components: [
    ComponentEnum.SPIDY,
    ComponentEnum.MOB
  ]
});

const spiderSystem: SystemFunction<SystemEnum, ComponentEnum> = () => {
  const onAdd = (id: string) => {
    console.log('Spidermaaaaannn!!', id);

    const entity = entities.get(id);
    // We can modify the component data...
    entity.updateComponent(ComponentEnum.SPIDY, {
      deathMessage: 'Mr. Stark? I don\'t feel so good... I don\'t wanna go...'
    });

    setTimeout(() => {
      // And also delete one component
      entity.removeComponent(ComponentEnum.SPIDY);
    }, 3000);
  }
  const onRemove = (id: string) => {
    // And here the fun beguns
    console.log(entities.get(id).getComponent(ComponentEnum.SPIDY).deathMessage, id);
  }
  return {
    id: SystemEnum.SPIDER_SYSTEM,
    components: [
      ComponentEnum.SPIDY,
      ComponentEnum.MOB
    ],
    onAdd,
    onRemove
  }
}

setSystems( spiderSystem() );

entities.add( spiderEntity('Tom_Holland') );

const loopWorker = new LoopWorker({ ticksPerSecond: 20 });
loopWorker.on('tick', (data) => onLoop(data.ms));
```
