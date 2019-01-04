import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";
import { reducer as formReducer } from "redux-form";
import config from "./config";
import viewer from "./viewer";
import data from "./data";

// main reducers
export const reducers = combineReducers({
  routing: routerReducer,
  form: formReducer,
  config: config,
  viewer: viewer,
  data: data
});
