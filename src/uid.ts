export const uid = () => {
  let lastId = 0;

  const getUID = () => {
    lastId++;
    return lastId;
  };

  return {
    getUID,
  };
};
