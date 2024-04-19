import {
	assert,
	assertEquals,
	assertNotEquals,
} from 'https://deno.land/std@0.195.0/testing/asserts.ts';

import { engine, SystemFunction } from '../src/index.ts';
import { Component, ComponentData, Entity, getEntity, System } from './utils.ts';
import { uid, UIDKey } from '../src/uid.ts';

Deno.test('Engine', async (test) => {
	const Engine = engine<Entity, Component, ComponentData>();
	const { getUID, reset } = uid(Engine.getEntityList);

	await test.step('expect getUID to be 1', () => {
		assertEquals(getUID(UIDKey.ENTITY), 1);
		assertEquals(getUID(UIDKey.SYSTEM), 1);
		assertEquals(getUID(UIDKey.INTERNAL), 1);
	});
	await test.step('expect reset to reset the uids', () => {
		assertEquals(getUID(UIDKey.ENTITY), 2);
		assertEquals(getUID(UIDKey.SYSTEM), 2);
		assertEquals(getUID(UIDKey.INTERNAL), 2);
		reset();
		assertEquals(getUID(UIDKey.ENTITY), 1);
		assertEquals(getUID(UIDKey.SYSTEM), 1);
		assertEquals(getUID(UIDKey.INTERNAL), 1);
	});

	await test.step('expect Engine.getEntityList to be empty', () => {
		assertEquals(Engine.getEntityList(), []);
	});

	await test.step('expect Engine.getSystem to be undefined', () => {
		assertEquals(Engine.getSystem(System.SYSTEM_A), undefined);
	});

	await test.step('expect Engine.setSystems to add a system', async () => {
		const system: SystemFunction<Component> = async () => ({
			id: System.SYSTEM_B,
			components: [],
		});

		await Engine.setSystems(system);

		const foundSystem = Engine.getSystem(System.SYSTEM_B);
		assertNotEquals(foundSystem, undefined);
	});

	await test.step('expect Engine.getEntityList to have 0 elements', () => {
		assertEquals(Engine.getEntityList(), []);
	});

	await test.step('expect Engine.getEntityList to have 6 element', async () => {
		await Engine.addEntity(
			{
				force: true,
				entities: [
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_A, {}, [])({}),
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_A, {}, [Component.COMPONENT_A])({}),
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_B, {}, [])({}),
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_B, {}, [Component.COMPONENT_A])({}),
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_C, {}, [
						Component.COMPONENT_A,
						Component.COMPONENT_B,
					])({}),
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_D, {}, [Component.COMPONENT_B])({}),
				],
			},
		);

		assert(Engine.getEntityList().length === 6);
	});

	await test.step('expect Engine.getEntityListByType with type 0 to have 2 entity', () => {
		assert(Engine.getEntityListByType(Entity.EXAMPLE_A).length === 2);
	});

	await test.step('expect Engine.getEntityListByType with type 1 to have 2 entity', () => {
		assert(Engine.getEntityListByType(Entity.EXAMPLE_B).length === 2);
	});

	await test.step('expect Engine.getEntityListByType with type 2 to have 1 entity', () => {
		assert(Engine.getEntityListByType(Entity.EXAMPLE_C).length === 1);
	});

	await test.step('expect Engine.getEntityListByType with type 3 to have 1 entity', () => {
		assert(Engine.getEntityListByType(Entity.EXAMPLE_D).length === 1);
	});

	await test.step('expect Engine.getEntityListByComponents with no components to have 6 entity', () => {
		assert(Engine.getEntityListByComponents().length === 6);
	});

	await test.step('expect Engine.getEntityListByComponents with a fake component to have 0 entity', () => {
		assertEquals(Engine.getEntityListByComponents(Component.COMPONENT_C), []);
	});

	await test.step('expect Engine.getEntityListByComponents with a component `C1` to have 3 entity', () => {
		assert(
			Engine.getEntityListByComponents(Component.COMPONENT_A).length === 3,
		);
	});

	await test.step('expect Engine.getEntityListByComponents with a component `C2` to have 2 entity', () => {
		assert(
			Engine.getEntityListByComponents(Component.COMPONENT_B).length === 2,
		);
	});

	await test.step('expect Engine.getEntityListByComponents with a component `C1` and `C2` to have 1 entity', () => {
		assert(
			Engine.getEntityListByComponents(
				Component.COMPONENT_A,
				Component.COMPONENT_B,
			).length === 1,
		);
	});

	await test.step('expect Engine.destroy to remove everything and reset ids', async () => {
		await Engine.destroy();

		assertEquals(Engine.getEntityList().length, 0);
		assertEquals(Engine.getSystem(System.SYSTEM_B), undefined);

		await Engine.addEntity(
			{
				force: true,
				entities: [
					getEntity(getUID(UIDKey.ENTITY), Entity.EXAMPLE_A, {}, [])({}),
				],
			},
		);
		assertEquals(Engine.getEntityList().length, 1);
	});
});
