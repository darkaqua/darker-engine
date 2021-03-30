
import {game} from "./game";
import {LoopWorker} from "@voidpixel/loop-worker";
import {EntityFunction, SystemFunction} from "./types";

console.log('Hello world!');

enum SystemEnum {
    SOMETHING,
    SOMETHING_2
}

enum ComponentEnum {
    PLAYER,
    MOB
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

    const onLoop = (delta: number) => {
        console.log(
            getSystemEntities(SystemEnum.SOMETHING)
                .map(id => entities.get(id).getData())
        )
    }

    return {
        id: SystemEnum.SOMETHING,
        components: [
            ComponentEnum.MOB
        ],
        onAdd,
        onRemove,
        onLoop
    }
}


setSystems(
    playerSystem(),
    playerSomethingSystem()
);

entities.add(
    playerEntity('Franz'),
    playerEntity('Pikolo')
);

const loopWorker = new LoopWorker({ ticksPerSecond: 20 });
loopWorker.on('tick', (data) => onLoop(data.ms))

