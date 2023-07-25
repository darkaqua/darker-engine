import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";

import { game, SystemFunction } from "../src/index.ts";
import { getEntity } from "./utils.ts";

Deno.test("Game", async (test) => {
  const Game = game();

  await test.step("expect Game.getUID to be 1", () => {
    assertEquals(Game.getUID(), 1);
  });

  await test.step("expect Game.getEntityList to be empty", () => {
    assertEquals(Game.getEntityList(), []);
  });

  await test.step("expect Game.getSystem to be undefined", () => {
    assertEquals(Game.getSystem("SYSTEM_A"), undefined);
  });

  await test.step("expect Game.setSystems to add a system", () => {
    const system: SystemFunction = () => ({
      id: "SYSTEM",
      components: [],
    });
    Game.setSystems(system);

    const foundSystem = Game.getSystem("SYSTEM");
    assertNotEquals(foundSystem, undefined);
  });

  await test.step("expect Game.getEntityList to have 0 elements", () => {
    assertEquals(Game.getEntityList(), []);
  });

  await test.step("expect Game.getEntityList to have 6 element", () => {
    Game.addEntity(
      getEntity(Game.getUID(), 0, {}, []),
      getEntity(Game.getUID(), 0, {}, ["C1"]),
      getEntity(Game.getUID(), 1, {}, []),
      getEntity(Game.getUID(), 1, {}, ["C1"]),
      getEntity(Game.getUID(), 2, {}, ["C1", "C2"]),
      getEntity(Game.getUID(), 3, {}, ["C2"]),
    );
    assert(Game.getEntityList().length === 6);
  });

  await test.step("expect Game.getEntityListByType with type 0 to have 2 entity", () => {
    assert(Game.getEntityListByType(0).length === 2);
  });

  await test.step("expect Game.getEntityListByType with type 1 to have 2 entity", () => {
    assert(Game.getEntityListByType(1).length === 2);
  });

  await test.step("expect Game.getEntityListByType with type 2 to have 1 entity", () => {
    assert(Game.getEntityListByType(2).length === 1);
  });

  await test.step("expect Game.getEntityListByType with type 3 to have 1 entity", () => {
    assert(Game.getEntityListByType(3).length === 1);
  });

  await test.step("expect Game.getEntityListByComponents with no components to have 6 entity", () => {
    assert(Game.getEntityListByComponents().length === 6);
  });

  await test.step("expect Game.getEntityListByComponents with a fake component to have 0 entity", () => {
    assertEquals(Game.getEntityListByComponents("NOT_VALID"), []);
  });

  await test.step("expect Game.getEntityListByComponents with a component `C1` to have 3 entity", () => {
    assert(Game.getEntityListByComponents("C1").length === 3);
  });

  await test.step("expect Game.getEntityListByComponents with a component `C2` to have 2 entity", () => {
    assert(Game.getEntityListByComponents("C2").length === 2);
  });

  await test.step("expect Game.getEntityListByComponents with a component `C1` and `C2` to have 1 entity", () => {
    assert(Game.getEntityListByComponents("C1", "C2").length === 1);
  });
});
