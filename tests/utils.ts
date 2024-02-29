import { EntityTypeFunction } from '../src/index.ts';

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

export type ComponentData = {
	[Component.COMPONENT_A]: {};
	[Component.COMPONENT_B]: {};
	[Component.COMPONENT_C]: {};
};

type EntityProps = {};
export const getEntity = (
	id: number,
	type: Entity = Entity.EXAMPLE_A,
	data = {},
	components: Component[] = [],
): EntityTypeFunction<Entity, Component, ComponentData, EntityProps> =>
() => ({
	id,
	type,
	data,
	components,
});
