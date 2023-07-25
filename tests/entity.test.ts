import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";
import { spy } from "https://deno.land/std@0.195.0/testing/mock.ts";

import { game, SystemFunction } from "../src/index.ts";
import { getEntity } from "./utils.ts";

Deno.test("Entity", async (test) => {
  const Game = game();

  const onAddSystemAMock = spy(() => {});
  const onAddSystemBMock = spy(() => {});

  const systemA: SystemFunction = () => ({
    id: "SYSTEM_A",
    components: ["COMPONENT_A"],
    onAdd: onAddSystemAMock,
  });
  const systemB: SystemFunction = () => ({
    id: "SYSTEM_B",
    components: ["COMPONENT_A", "COMPONENT_B"],
    onAdd: onAddSystemBMock,
  });
  Game.setSystems(systemA, systemB);

  const entityA = getEntity(Game.getUID(), 0);

  await test.step("expect add an entity", () => {
    Game.addEntity(entityA);

    const retrievedEntity = Game.getEntity(entityA.id);
    assertEquals(retrievedEntity.id, entityA.id);
  });

  await test.step("expect remove an entity", () => {
    Game.removeEntity(entityA.id);

    const retrievedEntity = Game.getEntity(entityA.id);
    assertEquals(retrievedEntity, undefined);
  });

  await test.step("expect raw data to be empty", () => {
    assertEquals(entityA?.getData?.(), {});
  });

  const componentData = {
    foo: "faa",
  };

  await test.step("expect update component data", () => {
    Game.addEntity(entityA);

    entityA?.updateComponent?.("COMPONENT_A", componentData);

    assertEquals(entityA?.getComponent?.("COMPONENT_A"), componentData);
  });

  await test.step("expect entity raw data to contain data", () => {
    assertEquals(entityA?.getData?.(), { "COMPONENT_A": componentData });
  });

  await test.step("expect to add new component to an existing entity", () => {
    assertNotEquals(entityA.id, undefined);

    const componentData = { foo: "faa", fii: 123 };

    entityA?.updateComponent?.("NEW_COMPONENT", componentData);

    assertEquals(entityA?.hasComponent?.("NEW_COMPONENT"), true);
    assertEquals(entityA?.getComponent?.("NEW_COMPONENT"), componentData);
  });
});
