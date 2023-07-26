import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.195.0/testing/asserts.ts';
import { spy } from 'https://deno.land/std@0.195.0/testing/mock.ts';

import { engine, SystemFunction } from '../src/index.ts';
import { Component, getEntity, System } from './utils.ts';

Deno.test('Entity', async (test) => {
	const Engine = engine();

	const onAddSystemAMock = spy(() => {});
	const onAddSystemBMock = spy(() => {});

	const systemA: SystemFunction = () => ({
		id: System.SYSTEM_A,
		components: [Component.COMPONENT_A],
		onAdd: onAddSystemAMock,
	});
	const systemB: SystemFunction = () => ({
		id: System.SYSTEM_B,
		components: [Component.COMPONENT_A, Component.COMPONENT_B],
		onAdd: onAddSystemBMock,
	});
	Engine.setSystems(systemA, systemB);

	const entityA = getEntity(Engine.getUID(), 0);

	await test.step('expect add an entity', () => {
		Engine.addEntity(entityA);

		const retrievedEntity = Engine.getEntity(entityA.id);
		assertEquals(retrievedEntity.id, entityA.id);
	});

	await test.step('expect remove an entity', () => {
		Engine.removeEntity(entityA.id);

		const retrievedEntity = Engine.getEntity(entityA.id);
		assertEquals(retrievedEntity, undefined);
	});

	await test.step('expect raw data to be empty', () => {
		assertEquals(entityA?.getData?.(), {});
	});

	const componentData = {
		foo: 'faa',
	};

	await test.step('expect update component data', () => {
		Engine.addEntity(entityA);

		entityA?.updateComponent?.(Component.COMPONENT_A, componentData);

		assertEquals(entityA?.getComponent?.(Component.COMPONENT_A), componentData);
	});

	await test.step('expect entity raw data to contain data', () => {
		assertEquals(entityA?.getData?.(), {
			[Component.COMPONENT_A]: componentData,
		});
	});

	await test.step('expect to add new component to an existing entity', () => {
		assertNotEquals(entityA.id, undefined);

		const componentData = { foo: 'faa', fii: 123 };

		entityA?.updateComponent?.(Component.COMPONENT_C, componentData);

		assertEquals(entityA?.hasComponent?.(Component.COMPONENT_C), true);
		assertEquals(entityA?.getComponent?.(Component.COMPONENT_C), componentData);
	});
});
