import { EntityType } from '../src/index.ts';

export enum Entity {
	EXAMPLE_A,
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
	data: Record<number, unknown> = {},
	components: number[] = [],
): EntityType => ({
	id,
	type,
	data,
	components,
});
