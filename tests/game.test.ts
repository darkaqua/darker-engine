import {game, SystemFunction} from "../src";
import {getEntity} from "./utils";

describe('Game', () => {
    
    const Game = game();
    
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
    
    test('expect Game.getEntityList to have 0 elements', () => {
        expect(Game.getEntityList()).toHaveLength(0);
    });
    
    test('expect Game.getEntityList to have 6 element', () => {
        Game.addEntity(
            getEntity(Game.getUID(), 0, {}, []),
            getEntity(Game.getUID(), 0, {}, ['C1']),
            getEntity(Game.getUID(), 1, {}, []),
            getEntity(Game.getUID(), 1, {}, ['C1']),
            getEntity(Game.getUID(), 2, {}, ['C1', 'C2']),
            getEntity(Game.getUID(), 3, {}, ['C2'])
        );
        expect(Game.getEntityList()).toHaveLength(6);
    });
    
    test('expect Game.getEntityListByType with type 0 to have 2 entity', () => {
        expect(Game.getEntityListByType(0)).toHaveLength(2);
    });
    
    test('expect Game.getEntityListByType with type 1 to have 2 entity', () => {
        expect(Game.getEntityListByType(1)).toHaveLength(2);
    });
    
    test('expect Game.getEntityListByType with type 2 to have 1 entity', () => {
        expect(Game.getEntityListByType(2)).toHaveLength(1);
    });
    
    test('expect Game.getEntityListByType with type 3 to have 1 entity', () => {
        expect(Game.getEntityListByType(3)).toHaveLength(1);
    });
    
    test('expect Game.getEntityListByComponents with no components to have 6 entity', () => {
        expect(Game.getEntityListByComponents()).toHaveLength(6);
    });
    
    test('expect Game.getEntityListByComponents with a fake component to have 0 entity', () => {
        expect(Game.getEntityListByComponents('NOT_VALID')).toHaveLength(0);
    });
    
    test('expect Game.getEntityListByComponents with a component `C1` to have 3 entity', () => {
        expect(Game.getEntityListByComponents('C1')).toHaveLength(3);
    });
    
    test('expect Game.getEntityListByComponents with a component `C2` to have 2 entity', () => {
        expect(Game.getEntityListByComponents('C2')).toHaveLength(2);
    });
    
    test('expect Game.getEntityListByComponents with a component `C1` and `C2` to have 1 entity', () => {
        expect(Game.getEntityListByComponents('C1', 'C2')).toHaveLength(1);
    });
    
});