
import {game} from "./game";
import {LoopWorker} from "@voidpixel/loop-worker";
import {EntityFunction, SystemFunction} from "./types";

console.log('Hello world!');

enum SystemEnum {
    SOMETHING,
    SOMETHING_2,
    ON_SPIDER
}

enum ComponentEnum {
    PLAYER,
    MOB,
    WEB
}

const {
    entities,
    onLoop,
    setSystems,
    getSystemEntities
} = game<SystemEnum, ComponentEnum>();


const playerEntity: EntityFunction<ComponentEnum> = (
    id: string
) => ({
    id,
    components: [
        ComponentEnum.PLAYER
    ]
});

const mobEntity: EntityFunction<ComponentEnum> = (
    id: string
) => ({
    id,
    components: [
        ComponentEnum.MOB
    ]
});

const spiderEntity: EntityFunction<ComponentEnum> = () => ({
    id: 'Spider',
    components: [
        ComponentEnum.MOB,
        ComponentEnum.WEB
    ]
});

const spiderSystem: SystemFunction<SystemEnum, ComponentEnum> = () => {

    const onAdd = (id: string) => {
        console.log('Spidemaaaaannn!!', id);

        const entity = entities.get(id);

        entity.updateComponent(ComponentEnum.WEB, {
            text: 'No me siento bien señor Stark!',

        });

        setTimeout(() => {
            entity.removeComponent(ComponentEnum.WEB);
        }, 3000);
    }
    const onRemove = (id: string) => {
        console.log(entities.get(id).getComponent(ComponentEnum.WEB).text, id);
    }

    return {
        id: SystemEnum.ON_SPIDER,
        components: [
            ComponentEnum.MOB,
            ComponentEnum.WEB
        ],
        onAdd,
        onRemove
    }
}

const playerSystem: SystemFunction<SystemEnum, ComponentEnum> = () => {
    const onAdd = (id: string) => {
        console.log('player', 'add', id);
        entities.add(mobEntity(`Mob_${id}`));
    }
    const onRemove = (id: string) => {
        console.log('player', 'remove', id);
    }

    return {
        id: SystemEnum.SOMETHING_2,
        components: [
            ComponentEnum.PLAYER
        ],
        onAdd,
        onRemove
    }
}

const playerSomethingSystem: SystemFunction<SystemEnum, ComponentEnum> = () => {
    const onAdd = (id: string) => {
        console.log('mob', 'add', id);
        console.log(entities.get(id).getData());
    }
    const onRemove = (id: string) => {
        console.log('mob', 'remove', id);
        console.log(entities.get(id).getData());
    }

    return {
        id: SystemEnum.SOMETHING,
        components: [
            ComponentEnum.MOB
        ],
        onAdd,
        onRemove
    }
}


setSystems(
    playerSystem(),
    playerSomethingSystem(),
    spiderSystem()
);

entities.add(
    playerEntity('Franz'),
    playerEntity('Pikolo')
);

setTimeout(() => {
    entities.add(spiderEntity());
}, 2000);

const loopWorker = new LoopWorker({ ticksPerSecond: 20 });
loopWorker.on('tick', (data) => onLoop(data.ms))

