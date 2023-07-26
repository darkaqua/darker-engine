import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";

import { engine, SystemFunction } from "../src/index.ts";
import {Component, getEntity, System} from "./utils.ts";

Deno.test("Engine", async (test) => {
  const Engine = engine();

  await test.step("expect Engine.getUID to be 1", () => {
    assertEquals(Engine.getUID(), 1);
  });

  await test.step("expect Engine.getEntityList to be empty", () => {
    assertEquals(Engine.getEntityList(), []);
  });

  await test.step("expect Engine.getSystem to be undefined", () => {
    assertEquals(Engine.getSystem(System.SYSTEM_A), undefined);
  });

  await test.step("expect Engine.setSystems to add a system", () => {
    const system: SystemFunction = () => ({
      id: System.SYSTEM_B,
      components: [],
    });
    Engine.setSystems(system);

    const foundSystem = Engine.getSystem(System.SYSTEM_B);
    assertNotEquals(foundSystem, undefined);
  });

  await test.step("expect Engine.getEntityList to have 0 elements", () => {
    assertEquals(Engine.getEntityList(), []);
  });

  await test.step("expect Engine.getEntityList to have 6 element", () => {
    Engine.addEntity(
      getEntity(Engine.getUID(), 0, {}, []),
      getEntity(Engine.getUID(), 0, {}, [Component.COMPONENT_A]),
      getEntity(Engine.getUID(), 1, {}, []),
      getEntity(Engine.getUID(), 1, {}, [Component.COMPONENT_A]),
      getEntity(Engine.getUID(), 2, {}, [Component.COMPONENT_A, Component.COMPONENT_B]),
      getEntity(Engine.getUID(), 3, {}, [Component.COMPONENT_B]),
    );
    assert(Engine.getEntityList().length === 6);
  });

  await test.step("expect Engine.getEntityListByType with type 0 to have 2 entity", () => {
    assert(Engine.getEntityListByType(0).length === 2);
  });

  await test.step("expect Engine.getEntityListByType with type 1 to have 2 entity", () => {
    assert(Engine.getEntityListByType(1).length === 2);
  });

  await test.step("expect Engine.getEntityListByType with type 2 to have 1 entity", () => {
    assert(Engine.getEntityListByType(2).length === 1);
  });

  await test.step("expect Engine.getEntityListByType with type 3 to have 1 entity", () => {
    assert(Engine.getEntityListByType(3).length === 1);
  });

  await test.step("expect Engine.getEntityListByComponents with no components to have 6 entity", () => {
    assert(Engine.getEntityListByComponents().length === 6);
  });

  await test.step("expect Engine.getEntityListByComponents with a fake component to have 0 entity", () => {
    assertEquals(Engine.getEntityListByComponents(Component.COMPONENT_C), []);
  });

  await test.step("expect Engine.getEntityListByComponents with a component `C1` to have 3 entity", () => {
    assert(Engine.getEntityListByComponents(Component.COMPONENT_A).length === 3);
  });

  await test.step("expect Engine.getEntityListByComponents with a component `C2` to have 2 entity", () => {
    assert(Engine.getEntityListByComponents(Component.COMPONENT_B).length === 2);
  });

  await test.step("expect Engine.getEntityListByComponents with a component `C1` and `C2` to have 1 entity", () => {
    assert(Engine.getEntityListByComponents(Component.COMPONENT_A, Component.COMPONENT_B).length === 1);
  });
});
