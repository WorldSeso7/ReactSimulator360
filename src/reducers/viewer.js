// users reducer
export default function viewer(state = {}, action) {
  const newState = Object.assign({}, state);
  switch (action.type) {
    case 'VIEWER_SET_SESSION_TOKEN':
      newState.sessionToken = action.payload.sessionToken;
      break;
    case 'VIEWER_SET_DATA':
      newState.baseUrl = action.payload.baseUrl;
      newState.environment = action.payload.environment;
      newState.pov = action.payload.pov;
      newState.images = action.payload.images;
      newState.layersCount = action.payload.layersCount;
      break;
    case 'VIEWER_SET_POV':
      newState.pov = action.payload.pov;
      break;

    // initial state
    default:
      return state;
  }
  return newState;
}
