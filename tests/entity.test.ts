import {game, SystemFunction} from "../src";
import {getEntity} from "./utils";

describe('Entity', () => {
    
    const Game = game();
    
    const onAddSystemAMock = jest.fn();
    const onAddSystemBMock = jest.fn();
    
    const systemA: SystemFunction = () => ({
        id: 'SYSTEM_A',
        components: ['COMPONENT_A'],
        onAdd: onAddSystemAMock
    });
    const systemB: SystemFunction = () => ({
        id: 'SYSTEM_B',
        components: ['COMPONENT_A', 'COMPONENT_B'],
        onAdd: onAddSystemBMock,
    });
    Game.setSystems(systemA, systemB);
    
    const entityA = getEntity(Game.getUID(), 0);
    
    test('expect add an entity', () => {
        Game.addEntity(entityA);
        
        const retrievedEntity = Game.getEntity(entityA.id);
        expect(retrievedEntity.id).toBe(entityA.id);
    });
    
    test('expect remove an entity', () => {
        Game.removeEntity(entityA.id);
    
        const retrievedEntity = Game.getEntity(entityA.id);
        expect(retrievedEntity).toBeUndefined()
    });
    
    test('expect raw data to be empty', () => {
        expect(entityA.getData()).toEqual({ })
    });
    
    const componentData = {
        foo: 'faa'
    }
    
    test('expect update component data', () => {
        Game.addEntity(entityA);
    
        entityA.updateComponent('COMPONENT_A', componentData);
        
        expect(entityA.getComponent('COMPONENT_A')).toEqual(componentData)
    });
    
    test('expect entity raw data to contain data', () => {
        expect(entityA.getData()).toEqual({ 'COMPONENT_A': componentData })
    });
    
    test('expect to add new component to an existing entity', () => {
        expect(entityA.id).not.toBeUndefined();
    
        const componentData = { foo: 'faa', fii: 123 };
        
        entityA.updateComponent('NEW_COMPONENT', componentData);
        
        expect(entityA.hasComponent('NEW_COMPONENT')).toBeTruthy();
        expect(entityA.getComponent('NEW_COMPONENT')).toEqual(componentData)
    })
});