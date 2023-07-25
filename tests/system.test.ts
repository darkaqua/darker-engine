import {
  assertNotEquals,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";

import {
  assertSpyCall,
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.195.0/testing/mock.ts";

import { game, SystemFunction } from "../src/index.ts";
import { getEntity } from "./utils.ts";

Deno.test("System", async (test) => {
  const Game = game();

  const onAddSystemAMock = spy(() => {});
  const onAddSystemBMock = spy(() => {});

  const onUpdateSystemAMock = spy(() => {});
  const onUpdateSystemBMock = spy(() => {});

  const onRemoveSystemAMock = spy(() => {});
  const onRemoveSystemBMock = spy(() => {});

  const onLoadSystemAMock = spy(() => {});
  const onLoadSystemBMock = spy(() => {});

  const onDestroySystemAMock = spy(() => {});
  const onDestroySystemBMock = spy(() => {});

  const systemA: SystemFunction = () => ({
    id: "SYSTEM_A",
    components: ["COMPONENT_A"],
    onAdd: onAddSystemAMock,
    onUpdate: onUpdateSystemAMock,
    onRemove: onRemoveSystemAMock,
    onLoad: onLoadSystemAMock,
    onDestroy: onDestroySystemAMock,
  });
  const systemB: SystemFunction = () => ({
    id: "SYSTEM_B",
    components: ["COMPONENT_A", "COMPONENT_B"],
    onAdd: onAddSystemBMock,
    onUpdate: onUpdateSystemBMock,
    onRemove: onRemoveSystemBMock,
    onLoad: onLoadSystemBMock,
    onDestroy: onDestroySystemBMock,
  });
  Game.setSystems(systemA, systemB);

  const entityA = getEntity(Game.getUID(), 0, {}, ["COMPONENT_A"]);

  await test.step("expect systems to exist", () => {
    assertNotEquals(Game.getSystem("SYSTEM_A"), undefined);
    assertNotEquals(Game.getSystem("SYSTEM_B"), undefined);
  });

  await test.step("onAdd", async (t) => {
    await t.step(
      "expect entity to be added on a system A but not system B",
      () => {
        Game.addEntity(entityA);

        assertSpyCallArg(onAddSystemAMock, 0, 0, entityA.id);
        assertSpyCalls(onAddSystemBMock, 0);
      },
    );
  });

  await test.step("onUpdate", async (t) => {
    entityA?.removeComponent?.("COMPONENT_B");

    await t.step(
      "expect entity to be updated on a system A and not to be called on system B",
      () => {
        entityA?.updateComponent?.("COMPONENT_A", {});

        assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
          entityA.id,
          "COMPONENT_A",
        ]);
        assertSpyCalls(onUpdateSystemBMock, 0);
      },
    );

    await t.step(
      "expect add component on entity and be added on a system B",
      () => {
        entityA?.updateComponent?.("COMPONENT_B", {});

        assertSpyCallArg(onAddSystemBMock, 0, 0, entityA.id);
      },
    );

    await t.step("expect entity to be updated on system A and B", () => {
      entityA?.updateComponent?.("COMPONENT_A", {});

      assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [entityA.id, "COMPONENT_A"]);
      assertSpyCallArgs(onUpdateSystemBMock, 0, 0, [entityA.id, "COMPONENT_A"]);
    });

    await t.step("expect entity to be updated only on system B", () => {
      entityA?.updateComponent?.("COMPONENT_B", {});

      // TODO: Check why this test is failing
      // expect(onUpdateSystemAMock).not.toBeCalledWith(entityA.id, 'COMPONENT_B');
      // expect(onUpdateSystemBMock).toBeCalledWith(entityA.id, 'COMPONENT_B');
      
      // assertSpyCalls(onUpdateSystemAMock, 0);
      // assertSpyCallArgs(onUpdateSystemBMock, 0, 0, [entityA.id, 'COMPONENT_B']);
    });
  });

  await test.step("onRemove", async (t) => {
    await t.step(
      "expect remove entity component and be removed from system B",
      () => {
        entityA?.removeComponent?.("COMPONENT_B");

        assertSpyCalls(onRemoveSystemAMock, 0);
        assertSpyCallArg(onRemoveSystemBMock, 0, 0, entityA.id);
      },
    );

    await t.step(
      "expect remove entity component and be removed from system A",
      () => {
        entityA?.removeComponent?.("COMPONENT_A");

        assertSpyCallArg(onRemoveSystemAMock, 0, 0, entityA.id);
      },
    );
  });

  await test.step("onLoad", async (t) => {
    await t.step("expect onLoad to be called inside system", () => {
      Game.load();

      assertSpyCall(onLoadSystemAMock, 0);
      assertSpyCall(onLoadSystemBMock, 0);
    });
  });

  await test.step("onDestroy", async (t) => {
    await t.step("expect onDestroy to be called inside system", () => {
      Game.destroy();

      assertSpyCall(onDestroySystemAMock, 0);
      assertSpyCall(onDestroySystemBMock, 0);
    });
  });
});
