import {game, SystemFunction} from "../src";
import {getEntity} from "./utils";

describe('System', () => {
    
    const Game = game();
    
    const onAddSystemAMock = jest.fn();
    const onAddSystemBMock = jest.fn();
    
    const onUpdateSystemAMock = jest.fn();
    const onUpdateSystemBMock = jest.fn();
    
    const systemA: SystemFunction = () => ({
        id: 'SYSTEM_A',
        components: ['COMPONENT_A'],
        onAdd: onAddSystemAMock,
        onUpdate: onUpdateSystemAMock,
    });
    const systemB: SystemFunction = () => ({
        id: 'SYSTEM_B',
        components: ['COMPONENT_A', 'COMPONENT_B'],
        onAdd: onAddSystemBMock,
        onUpdate: onUpdateSystemBMock,
    });
    Game.setSystems(systemA, systemB);
    
    const entityA = getEntity(Game.getUID(), 0, {}, ['COMPONENT_A']);
    
    describe('onAdd', () => {
        
        test('expect entity to be added on a system A but not system B', () => {
            Game.addEntity(entityA);
        
            expect(onAddSystemAMock).toBeCalledWith(entityA.id);
            expect(onAddSystemBMock).not.toBeCalledWith(entityA.id);
        });
        
    });
    
    describe('onUpdate', () => {
        
        beforeAll(() => {
            entityA.removeComponent('COMPONENT_B');
        });
        
        test('expect entity to be updated on a system A and not to be called on system B', () => {
            entityA.updateComponent('COMPONENT_A', {});
            
            expect(onUpdateSystemAMock).toBeCalledWith(entityA.id, 'COMPONENT_A');
            expect(onUpdateSystemBMock).not.toBeCalledWith(entityA.id, 'COMPONENT_A');
        });
        
        test('expect add component on entity and be added on a system B', () => {
            entityA.updateComponent('COMPONENT_B', {});
            
            expect(onAddSystemBMock).toBeCalledWith(entityA.id);
        });
    
        test('expect entity to be updated on system A and B', () => {
            entityA.updateComponent('COMPONENT_A', {});
        
            expect(onUpdateSystemAMock).toBeCalledWith(entityA.id, 'COMPONENT_A');
            expect(onUpdateSystemBMock).toBeCalledWith(entityA.id, 'COMPONENT_A');
        });
    
        test('expect entity to be updated only on system B', () => {
            entityA.updateComponent('COMPONENT_B', {});
        
            expect(onUpdateSystemAMock).not.toBeCalledWith(entityA.id, 'COMPONENT_B');
            expect(onUpdateSystemBMock).toBeCalledWith(entityA.id, 'COMPONENT_B');
        });
    });
    
    describe('onRemove', () => {
    
    });
    
});