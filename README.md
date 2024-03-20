[![](https://img.shields.io/badge/dependencies-0-yellow?style=for-the-badge)](https://www.npmjs.com/package/darker-engine?activeTab=dependencies)
[![](https://img.shields.io/github/workflow/status/darkaqua/darker-engine/Tests?label=Tests&style=for-the-badge)](https://github.com/darkaqua/darker-engine/actions/workflows/tests.yml)
[![](https://img.shields.io/github/workflow/status/darkaqua/darker-engine/Publish?label=Build&style=for-the-badge)](https://github.com/darkaqua/darker-engine/actions/workflows/publish.yml)
[![](https://img.shields.io/npm/v/darker-engine?style=for-the-badge)](https://www.npmjs.com/package/darker-engine)
[![](https://img.shields.io/bundlephobia/min/darker-engine?label=BUILD%20SIZE&style=for-the-badge)](https://www.npmjs.com/package/darker-engine)

# Darker-Engine

Lightweight functional library implementation of the
[Entity-Component-System](https://en.wikipedia.org/wiki/Entity_component_system)
pattern with typescript.

## Installation

### Deno

Import the package with deno:

```ts
import { engine as darkerEngine } from "https://deno.land/x/darker_engine/mod.ts";
```

### npm

Install the package with npm:

```bash
npm install darker-engine
```

## Concepts

### Action Queue System

This engine implements an action queue with three levels of priority: `Priority.HIGH`, `Priority.MEDIUM`, `Priority.LOW`.
Actions are added to the queue and processed based on their priority.

#### Config
With `Engine.load` config we can specify how many ticks we want per second. By default, is 60

```ts
await Engine.load({
  ticksPerSecond: 40,
})
```

With `Engine.onTick` we can sets a callback function that is run on each iteration of the loop.
The callback function receives an object with the result of the last processed action, the time (`ms`) the iteration took, and the % usage of the tick.

```ts
Engine.onTick(({usage, ms, status}) => {
  console.log({ms, usage, actionId: status?.id})
})
// -> { ms: 2, usage: 0.02, actionId: 1 }
```

With `Engine.pause` you can pause the entire engine loop. All systems will call `onPause` function before.

```ts
await Engine.pause()
```

With `Engine.resume` you can start again the engine loop. All systems will call `onResume` function after the loop restarts.

```ts
await Engine.resume()
```

#### Add Actions To Queue
When we use `addEntity`, `removeEntity`, `entity.updateComponent` and `entity.removeComponent` we can specify if we want to perform the action immediately or assign it a priority.

By default, they are added to the queue and assigned a medium priority (`Priority.MEDIUM`)

```ts
// Action added to HIGH priority queue
await Engine.addEntity({
  priority: Priority.HIGH,
  entities: [exampleEntity()]
})

// Action that is executed immediately without depending on the queue
await Engine.addEntity({
  force: true,
  entities: [exampleEntity()]
})
```

## Code Example

#### Declaration

```ts
import { engine } from "darker-engine";

export const Engine = engine<IEntities, IComponents, ComponentData>();

Engine.setSystems(...[]);

Engine.load({
  ticksPerSecond: 40
});
```

#### Enums

```ts
enum EntityType {
  EXAMPLE_ENTITY,
}

enum Components {
  EXAMPLE_COMPONENT,
  OTHER_COMPONENT
}

type ComponentData = {
  [Components.EXAMPLE_COMPONENT]: {
    foo: string;
  },
  [Components.OTHER_COMPONENT]: {
    bar: number;
  };
};
```

#### Entity

```ts
import { EntityTypeFunction } from "darker-engine";

const exampleEntity: EntityTypeFunction<IEntities, IComponents, ComponentData, any> = () => ({
  type: Entities.EXAMPLE_ENTITY,
  data: {
    [Components.EXAMPLE_COMPONENT]: {
      foo: "faa",
    }
  },
  components: [Components.EXAMPLE_COMPONENT],
})
```

#### Systems

```ts
import { SystemFunction } from "darker-engine";

const exampleSystem: SystemFunction<Components> = async () => {
  const onAdd = async (entityId: number) => {};
  const onUpdate = async (entityId: number, component: string) => {};
  const onRemove = async (entityId: number) => {};

  return {
    components: [],
    onAdd,
    onUpdate,
    onRemove,
  };
};
```

#### Full code

```ts
import {engine, EntityTypeFunction, SystemFunction} from "darker-engine";

enum IEntities {
  EXAMPLE_ENTITY,
}

enum IComponents {
  EXAMPLE_COMPONENT,
  OTHER_COMPONENT,
}

type ComponentData = {
  [IComponents.EXAMPLE_COMPONENT]: {
    foo: string;
  },
  [IComponents.OTHER_COMPONENT]: {
    bar: number;
  };
};

export const Engine = engine<IEntities, IComponents, ComponentData>()

const exampleEntity: EntityTypeFunction<IEntities, IComponents, ComponentData, void> = () => ({
  type: IEntities.EXAMPLE_ENTITY,
  data: {
    [IComponents.EXAMPLE_COMPONENT]: {
      foo: "faa",
    }
  },
  components: [IComponents.EXAMPLE_COMPONENT],
})

const exampleSystem: SystemFunction<IComponents> = async () => {
  let interval: number

  const onLoad = async () => {
    console.log("welcome!");

    await Engine.addEntity({
      entities: [exampleEntity()]
    })

    interval = setInterval(() => {
      const entityList = Engine.getEntityList();
      const entityListByType = Engine.getEntityListByType(IEntities.EXAMPLE_ENTITY);
      const entityListByComponents = Engine.getEntityListByComponents(
        IComponents.EXAMPLE_COMPONENT,
      );

      console.log(`Entities`);
      console.log(` - total: ${entityList.length}`);
      console.log(` - type: ${entityListByType.length}`);
      console.log(` - component: ${entityListByComponents.length}`);
    }, 5000);
  }

  const onDestroy = async () => {
    clearInterval(interval);
    console.log("bye!");
  }

  const onAdd = async (id: number) => {
    const entity = Engine.getEntity(id);
    if(entity) {
      await entity.updateComponent({
        component: IComponents.EXAMPLE_COMPONENT,
        data: {foo: 'fii2'}
      })
    }
  }

  const onUpdate = async (id: number, component?: IComponents) => {
    const entity = Engine.getEntity(id);

    if (!entity || component !== IComponents.EXAMPLE_COMPONENT) return;

    const { foo } = entity.getComponent(IComponents.EXAMPLE_COMPONENT);
    if (foo === "fii" && !entity.hasComponent(IComponents.OTHER_COMPONENT)) {
      await entity.removeComponent({
        component: IComponents.EXAMPLE_COMPONENT
      })
    }
  }

  const onRemove = async (entityId: number) => {
    await Engine.removeEntity({ids: [entityId]})
  };

  const onResume = async () => {
    console.log('system wake up')
  }

  const onPause = async () => {
    console.log('system paused')
  }

  return {
    components: [IComponents.EXAMPLE_COMPONENT],
    onLoad,
    onResume,
    onPause,
    onDestroy,
    onAdd,
    onUpdate,
    onRemove,
  }
}

await Engine.setSystems(exampleSystem);
await Engine.load({
  ticksPerSecond: 2,
})

Engine.onTick(({usage, ms, status, tickCount}) => {
  console.log({ ms, usage, status, tickCount})
})
```
