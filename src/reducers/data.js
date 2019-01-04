// users reducer
export default function data(state = {environments: {}, povs: {}, objects: {}, configurations: {}, images: {}, hotspots: {}, positions: {}, abouts: {}, full: false}, action) {
  let newState;
  switch (action.type) {
    case 'SET_ENVIRONMENTS':
      newState = computeNewState(state, action);
      break;
    case 'SET_CURRENT_ENVIRONMENT_DATA':
      newState = computeNewState(state, action);
      newState.full = true;
      break;
    case 'RESET_CURRENT_ENVIRONMENT_DATA':
      newState = Object.assign({}, {environments: {}, povs: {}, objects: {}, configurations: {}, images: {}, hotspots: {}, positions: {}, abouts: {}, full: false});
      break;

    // initial state
    default:
      return state;
  }
  return newState;
}

export function computeNewState(state, action) {
  let newState = Object.assign({}, state);
  if (action.payload) {
    for (let i in action.payload) {
      if (action.payload.hasOwnProperty(i)) {
        newState[i] = [];
        let models = action.payload[i];
        for (let id in models) {
          if (models.hasOwnProperty(id)) {
            let model = models[id];
            newState[i][id] = Object.assign({}, model);
          }
        }
      }
    }
  }
  return newState;
}

