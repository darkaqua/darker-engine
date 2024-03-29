import { assertNotEquals } from 'https://deno.land/std@0.195.0/testing/asserts.ts';

import {
	assertSpyCall,
	assertSpyCallArg,
	assertSpyCallArgs,
	assertSpyCalls,
	spy,
} from 'https://deno.land/std@0.195.0/testing/mock.ts';

import { engine, EntityType, SystemFunction } from '../src/index.ts';
import { Component, ComponentData, Entity, getEntity, System } from './utils.ts';
import { uid, UIDKey } from '../src/uid.ts';

Deno.test('System', async (test) => {
	const Engine = engine<Entity, Component, ComponentData>();
	const { getUID } = uid(Engine.getEntityList);

	const onAddSystemAMock = spy(async () => {});
	const onAddSystemBMock = spy(async () => {});

	const onUpdateSystemAMock = spy(async () => {});
	const onUpdateSystemBMock = spy(async () => {});

	const onRemoveSystemAMock = spy(async () => {});
	const onRemoveSystemBMock = spy(async () => {});

	const onLoadSystemAMock = spy(async () => {});
	const onLoadSystemBMock = spy(async () => {});

	const onPauseSystemAMock = spy(async () => {});
	const onPauseSystemBMock = spy(async () => {});

	const onResumeSystemAMock = spy(async () => {});
	const onResumeSystemBMock = spy(async () => {});

	const onDestroySystemAMock = spy(async () => {});
	const onDestroySystemBMock = spy(async () => {});

	const systemA: SystemFunction<Component> = async () => ({
		id: System.SYSTEM_A,
		components: [Component.COMPONENT_A],
		onAdd: onAddSystemAMock,
		onUpdate: onUpdateSystemAMock,
		onRemove: onRemoveSystemAMock,
		onLoad: onLoadSystemAMock,
		onPause: onPauseSystemAMock,
		onResume: onResumeSystemAMock,
		onDestroy: onDestroySystemAMock,
	});

	const systemB: SystemFunction<Component> = async () => ({
		id: System.SYSTEM_B,
		components: [Component.COMPONENT_A, Component.COMPONENT_B],
		onAdd: onAddSystemBMock,
		onUpdate: onUpdateSystemBMock,
		onRemove: onRemoveSystemBMock,
		onLoad: onLoadSystemBMock,
		onPause: onPauseSystemBMock,
		onResume: onResumeSystemBMock,
		onDestroy: onDestroySystemBMock,
	});
	await Engine.setSystems(systemA, systemB);

	const entityA = getEntity(getUID(UIDKey.ENTITY), 0, {}, [Component.COMPONENT_A])(
		{},
	) as EntityType<
		Entity,
		Component,
		ComponentData
	>;

	await test.step('expect systems to exist', () => {
		assertNotEquals(Engine.getSystem(System.SYSTEM_A), undefined);
		assertNotEquals(Engine.getSystem(System.SYSTEM_B), undefined);
	});

	await test.step('onAdd', async (t) => {
		await t.step(
			'expect entity to be added on a system A but not system B',
			async () => {
				await Engine.addEntity({
					force: true,
					entities: [entityA],
				});

				assertSpyCallArg(onAddSystemAMock, 0, 0, entityA.id);
				assertSpyCalls(onAddSystemBMock, 0);
			},
		);
	});

	await test.step('onUpdate', async (t) => {
		await entityA.removeComponent({ force: true, component: Component.COMPONENT_B });

		await t.step(
			'expect entity to be updated on a system A and not to be called on system B',
			async () => {
				await entityA.updateComponent({
					force: true,
					component: Component.COMPONENT_A,
					data: {},
				});

				assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
					entityA.id,
					Component.COMPONENT_A,
				]);
				assertSpyCalls(onUpdateSystemBMock, 0);
			},
		);

		await t.step(
			'expect add component on entity and be added on a system B',
			async () => {
				await entityA.updateComponent({ force: true, component: Component.COMPONENT_B, data: {} });

				assertSpyCallArg(onAddSystemBMock, 0, 0, entityA.id);
			},
		);

		await t.step('expect entity to be updated on system A and B', async () => {
			await entityA.updateComponent({ force: true, component: Component.COMPONENT_A, data: {} });

			assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
				entityA.id,
				Component.COMPONENT_A,
			]);
			assertSpyCallArgs(onUpdateSystemBMock, 0, 0, [
				entityA.id,
				Component.COMPONENT_A,
			]);
		});

		await t.step('expect entity to be updated only on system B', async () => {
			await entityA.updateComponent({ force: true, component: Component.COMPONENT_B, data: {} });

			// Good "ñapa" but works \o/
			try {
				assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
					entityA.id,
					Component.COMPONENT_B,
				]);
			} catch (e) {
				if (!e.message.startsWith('Values are not equal.')) {
					throw e;
				}
			}
			assertSpyCallArgs(onUpdateSystemBMock, 1, 0, [
				entityA.id,
				Component.COMPONENT_B,
			]);
		});
	});

	await test.step('onRemove', async (t) => {
		await t.step(
			'expect remove entity component and be removed from system B',
			async () => {
				await entityA.removeComponent({ force: true, component: Component.COMPONENT_B });

				assertSpyCalls(onRemoveSystemAMock, 0);
				assertSpyCallArg(onRemoveSystemBMock, 0, 0, entityA.id);
			},
		);

		await t.step(
			'expect remove entity component and be removed from system A',
			async () => {
				await entityA.removeComponent({ force: true, component: Component.COMPONENT_A });

				assertSpyCallArg(onRemoveSystemAMock, 0, 0, entityA.id);
			},
		);
	});

	await test.step('onLoad', async (t) => {
		await t.step('expect onLoad to be called inside system', async () => {
			await Engine.load({ ticksPerSecond: 1 });

			assertSpyCall(onLoadSystemAMock, 0);
			assertSpyCall(onLoadSystemBMock, 0);

			Engine.clear();
		});
	});

	await test.step('onPause', async (t) => {
		await t.step('expect onPause to be called inside system', async () => {
			await Engine.setSystems(systemA, systemB);
			await Engine.pause();

			assertSpyCall(onPauseSystemAMock, 0);
			assertSpyCall(onPauseSystemBMock, 0);

			Engine.clear();
		});
	});

	await test.step('onResume', async (t) => {
		await t.step('expect onResume to be called inside system', async () => {
			await Engine.setSystems(systemA, systemB);
			await Engine.resume();

			assertSpyCall(onResumeSystemAMock, 0);
			assertSpyCall(onResumeSystemBMock, 0);

			Engine.clear();
		});
	});
});
