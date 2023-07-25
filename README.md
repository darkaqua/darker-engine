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
import { engine as darkerEngine } from "https://deno.land/_TODO_/mod.ts";
```

### npm
Install the package with npm:

```bash
npm install darker-engine
```


### Code Example

#### Declaration

```ts
import { engine as darkerEngine } from "darker-engine";

export const Engine = darkerEngine();

Engine.setSystems(...[]);

Engine.load();
```

#### Enums

```ts
enum EntityType {
  EXAMPLE,
}

enum Components {
  EXAMPLE_COMPONENT = "EXAMPLE_COMPONENT",
}
```

#### Entity

```ts
import { EntityType } from "darker-engine";

const exampleEntity = (): EntityType => ({
  id: Engine.getUID(),
  type: EntityType.EXAMPLE,
  data: {},
  components: [],
});
```

#### Systems

```ts
import { SystemFunction } from "darker-engine";

const exampleSystem: SystemFunction = () => {
  const onAdd = (entityId: number) => {};
  const onUpdate = (entityId: number, component: string) => {};
  const onRemove = (entityId: number) => {};

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
import { EntityType, engine as darkerEngine, SystemFunction } from "darker-engine";

export const Engine = darkerEngine();

enum EntityType {
  EXAMPLE,
}

enum Components {
  EXAMPLE_COMPONENT = "EXAMPLE_COMPONENT",
}

const exampleEntity = (): EntityType => ({
  id: Engine.getUID(),
  type: EntityType.EXAMPLE,
  data: {
    [Components.EXAMPLE_COMPONENT]: {
      foo: "faa",
    },
  },
  components: [
    Components.EXAMPLE_COMPONENT,
  ],
});

const exampleSystem: SystemFunction = () => {
  let interval;

  Engine.onLoad(() => {
    console.log("welcome!");
    Engine.addEntity(exampleEntity());

    interval = setInterval(() => {
      const entityList = Engine.getEntityList();
      const entityListByType = Engine.getEntityListByType(EntityType.EXAMPLE);
      const entityListByComponents = Engine.getEntityListByComponents(
        Components.EXAMPLE_COMPONENT,
      );

      console.log(`Entities`);
      console.log(` - total: ${entityList.length}`);
      console.log(` - type: ${entityListByType.length}`);
      console.log(` - component: ${entityListByComponents.length}`);
    }, 5_000);
  });

  Engine.onDestroy(() => {
    clearInterval(interval);
    console.log("bye!");
  });

  const onAdd = (entityId: number) => {
    const entity = Engine.getEntity(id);
    entity.updateComponent(Components.EXAMPLE_COMPONENT, { foo: "fii" });
  };

  const onUpdate = (entityId: number, component: string) => {
    const entity = Engine.getEntity(id);

    if (component !== Components.EXAMPLE_COMPONENT) return;

    const { foo } = entity.getComponent(Components.EXAMPLE_COMPONENT);
    if (foo === "fii" && !entity.hasComponent("FAKE_COMPONENT")) {
      entity.removeComponent(Components.EXAMPLE_COMPONENT);
    }
  };

  const onRemove = (entityId: number) => {
    Engine.removeEntity(entityId);
  };

  return {
    components: [
      Components.EXAMPLE_COMPONENT,
    ],
    onAdd,
    onUpdate,
    onRemove,
  };
};

Engine.setSystems(exampleSystem);
Engine.load();
```
