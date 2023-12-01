export const uid = (getEntityList) => {
	let lastId = 0;

	const getUID = () => {
		do {
			lastId++;
		} while (getEntityList()[lastId]);
		return lastId;
	};

	return {
		getUID,
	};
};
