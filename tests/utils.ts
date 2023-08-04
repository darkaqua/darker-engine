import { EntityType } from '../src/index.ts';

export enum Entity {
	EXAMPLE_A,
	EXAMPLE_B,
	EXAMPLE_C,
	EXAMPLE_D,
}

export enum System {
	SYSTEM_A,
	SYSTEM_B,
}

export enum Component {
	COMPONENT_A,
	COMPONENT_B,
	COMPONENT_C,
}

export const getEntity = (
	id: number,
	type: number = Entity.EXAMPLE_A,
	data = {},
	components: number[] = [],
): EntityType<Entity, Component, any> => ({
	id,
	type,
	data,
	components,
});
