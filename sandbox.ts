import {EntityType, SystemFunction, engine} from './mod.ts'

enum IEntities {
    EXAMPLE_ENTITY,
}

enum IComponents {
    EXAMPLE_COMPONENT,
    OTHER_COMPONENT,
}

const Engine = engine<IEntities, IComponents>()

const exampleEntity = (): EntityType<IEntities, IComponents> => ({
  id: Engine.getUID(),
  type: IEntities.EXAMPLE_ENTITY,
  data: {
    [IComponents.EXAMPLE_COMPONENT]: {
      foo: "faa",
    },
  },
  components: [IComponents.EXAMPLE_COMPONENT],
})

const exampleSystem: SystemFunction = () => {
  let interval: number

  const onLoad = () => {
    console.log("welcome!");
    Engine.addEntity(exampleEntity());

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
    }, 2000);
  }

  const onDestroy = () => {
    clearInterval(interval);
    console.log("bye!");
  }

  const onAdd = (id: number) => {
    console.log("onAdd", id)
    const entity = Engine.getEntity(id);
    entity.updateComponent?.(IComponents.EXAMPLE_COMPONENT, { foo: "fii" });
  }

  const onUpdate = (id: number, component: number) => {
    console.log("onUpdate", id, component)
    const entity = Engine.getEntity<IEntities, IComponents>(id);

    if (component !== IComponents.EXAMPLE_COMPONENT) return;

    const { foo } = entity.getComponent?.(IComponents.EXAMPLE_COMPONENT);
    if (foo === "fii" && !entity.hasComponent?.(IComponents.OTHER_COMPONENT)) {
      console.log("foo === fii")
      entity.removeComponent?.(IComponents.EXAMPLE_COMPONENT);
    }
  }

  const onRemove = (entityId: number) => {
    Engine.removeEntity(entityId);
  };

  return {
    id: Engine.getUID(),
    components: [IComponents.EXAMPLE_COMPONENT],
    onLoad,
    onDestroy,
    onAdd,
    onUpdate,
    onRemove,
  }
}

Engine.setSystems(exampleSystem);
Engine.load()
