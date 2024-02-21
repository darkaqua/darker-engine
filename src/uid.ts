export const uid = getEntityList => {
	const lastSafeIdMap: Record<UIDKey, number> = {
		[UIDKey.ENTITY]: 0,
		[UIDKey.SYSTEM]: 0, //<< meh
	};
	const lastIdMap: Record<UIDKey, number> = {
		[UIDKey.ENTITY]: 0,
		[UIDKey.SYSTEM]: 0,
	};
	const idCheckMapFunc: Record<UIDKey, (currentId?: number) => boolean> = {
		[UIDKey.ENTITY]: (currentId: number) => getEntityList()[currentId],
		[UIDKey.SYSTEM]: () => false,
	};
	
	const getUID = (key: UIDKey, safe: boolean = false) => {
		const increment = safe ? 10_000 : 0;
		
		const _getUID = () =>
			(safe ? lastSafeIdMap[key] : lastIdMap[key]) + increment;
		do {
			if (safe) lastSafeIdMap[key]++;
			else lastIdMap[key]++;
		} while (idCheckMapFunc[key](_getUID()));
		return _getUID();
	};
	
	return {
		getUID,
	};
};

export enum UIDKey {
	ENTITY,
	SYSTEM,
}
