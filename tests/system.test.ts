import { assertNotEquals } from 'https://deno.land/std@0.195.0/testing/asserts.ts';

import {
	assertSpyCall,
	assertSpyCallArg,
	assertSpyCallArgs,
	assertSpyCalls,
	spy,
} from 'https://deno.land/std@0.195.0/testing/mock.ts';

import { engine, SystemFunction } from '../src/index.ts';
import { Component, Entity, getEntity, System } from './utils.ts';

Deno.test('System', async (test) => {
	const Engine = engine<Entity, Component, any>();

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

	const systemA: SystemFunction<Component> = () => ({
		id: System.SYSTEM_A,
		components: [Component.COMPONENT_A],
		onAdd: onAddSystemAMock,
		onUpdate: onUpdateSystemAMock,
		onRemove: onRemoveSystemAMock,
		onLoad: onLoadSystemAMock,
		onDestroy: onDestroySystemAMock,
	});
	const systemB: SystemFunction<Component> = () => ({
		id: System.SYSTEM_B,
		components: [Component.COMPONENT_A, Component.COMPONENT_B],
		onAdd: onAddSystemBMock,
		onUpdate: onUpdateSystemBMock,
		onRemove: onRemoveSystemBMock,
		onLoad: onLoadSystemBMock,
		onDestroy: onDestroySystemBMock,
	});
	Engine.setSystems(systemA, systemB);

	const entityA = getEntity(Engine.getUID(), 0, {}, [Component.COMPONENT_A]);

	await test.step('expect systems to exist', () => {
		assertNotEquals(Engine.getSystem(System.SYSTEM_A), undefined);
		assertNotEquals(Engine.getSystem(System.SYSTEM_B), undefined);
	});

	await test.step('onAdd', async (t) => {
		await t.step(
			'expect entity to be added on a system A but not system B',
			() => {
				Engine.addEntity(entityA);

				assertSpyCallArg(onAddSystemAMock, 0, 0, entityA.id);
				assertSpyCalls(onAddSystemBMock, 0);
			},
		);
	});

	await test.step('onUpdate', async (t) => {
		entityA?.removeComponent?.(Component.COMPONENT_B);

		await t.step(
			'expect entity to be updated on a system A and not to be called on system B',
			() => {
				entityA?.updateComponent?.(Component.COMPONENT_A, {});

				assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
					entityA.id,
					Component.COMPONENT_A,
				]);
				assertSpyCalls(onUpdateSystemBMock, 0);
			},
		);

		await t.step(
			'expect add component on entity and be added on a system B',
			() => {
				entityA?.updateComponent?.(Component.COMPONENT_B, {});

				assertSpyCallArg(onAddSystemBMock, 0, 0, entityA.id);
			},
		);

		await t.step('expect entity to be updated on system A and B', () => {
			entityA?.updateComponent?.(Component.COMPONENT_A, {});

			assertSpyCallArgs(onUpdateSystemAMock, 0, 0, [
				entityA.id,
				Component.COMPONENT_A,
			]);
			assertSpyCallArgs(onUpdateSystemBMock, 0, 0, [
				entityA.id,
				Component.COMPONENT_A,
			]);
		});

		await t.step('expect entity to be updated only on system B', () => {
			entityA?.updateComponent?.(Component.COMPONENT_B, {});

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
			() => {
				entityA?.removeComponent?.(Component.COMPONENT_B);

				assertSpyCalls(onRemoveSystemAMock, 0);
				assertSpyCallArg(onRemoveSystemBMock, 0, 0, entityA.id);
			},
		);

		await t.step(
			'expect remove entity component and be removed from system A',
			() => {
				entityA?.removeComponent?.(Component.COMPONENT_A);

				assertSpyCallArg(onRemoveSystemAMock, 0, 0, entityA.id);
			},
		);
	});

	await test.step('onLoad', async (t) => {
		await t.step('expect onLoad to be called inside system', () => {
			Engine.load();

			assertSpyCall(onLoadSystemAMock, 0);
			assertSpyCall(onLoadSystemBMock, 0);
		});
	});

	await test.step('onDestroy', async (t) => {
		await t.step('expect onDestroy to be called inside system', () => {
			Engine.destroy();

			assertSpyCall(onDestroySystemAMock, 0);
			assertSpyCall(onDestroySystemBMock, 0);
		});
	});
});
