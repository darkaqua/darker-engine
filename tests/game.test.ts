import {game, SystemFunction} from "../src";
import {getEntity} from "./utils";

describe('Game', () => {
    
    const Game = game();
    
    const onLoadMock = jest.fn();
    const onDestroyMock = jest.fn();
    
    test('expect Game.getUID to be 1', () => {
        expect(Game.getUID()).toBe(1);
    });
    
    test('expect Game.getEntityList to be empty', () => {
        expect(Game.getEntityList()).toHaveLength(0)
    });
    
    test('expect Game.getSystem to be undefined', () => {
        expect(Game.getSystem('SYSTEM_A')).toBeUndefined()
    });
    
    test('expect Game.setSystems to add a system', () => {
        const system: SystemFunction = () => ({
            id: 'SYSTEM',
            components: []
        });
        Game.setSystems(system);
        
        const foundSystem = Game.getSystem('SYSTEM');
        expect(foundSystem).not.toBeUndefined();
    });
    
    test('expect Game.load to be called', () => {
        Game.onLoad(onLoadMock);
        
        Game.load();
        expect(onLoadMock).toBeCalled()
    });
    
    test('expect Game.getEntityList to have 0 elements', () => {
        expect(Game.getEntityList()).toHaveLength(0);
    });
    
    test('expect Game.getEntityList to have 1 element', () => {
        Game.addEntity(getEntity(Game.getUID()));
        expect(Game.getEntityList()).toHaveLength(1);
    });
    
    test('expect Game.getEntityListByType with type 0 to have 1 entity', () => {
        expect(Game.getEntityListByType(0)).toHaveLength(1);
    });
    
    test('expect Game.getEntityListByType with type 1 to have 0 entity', () => {
        expect(Game.getEntityListByType(1)).toHaveLength(0);
    });
    
    test('expect Game.getEntityListByComponents with no components to have 1 entity', () => {
        expect(Game.getEntityListByComponents()).toHaveLength(1);
    });
    
    test('expect Game.getEntityListByComponents with a fake component to have 0 entity', () => {
        expect(Game.getEntityListByComponents('NOT_VALID')).toHaveLength(0);
    });
    
    test('expect Game.destroy to be called', () => {
        Game.onDestroy(onDestroyMock);
        
        Game.destroy();
        expect(onDestroyMock).toBeCalled()
    });
    
    test('expect Game.getEntityList to have 0 element', () => {
        expect(Game.getEntityList()).toHaveLength(0);
    });
});