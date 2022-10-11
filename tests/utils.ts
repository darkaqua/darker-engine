import {EntityType} from "../src";

export enum Entity {
    EXAMPLE_A
}

export const getEntity = (
    id: number,
    type: number = Entity.EXAMPLE_A,
    data: Record<string, Object> = {},
    components: string[] = []
): EntityType => ({
    id,
    type,
    data,
    components
})