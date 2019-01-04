import React from "react";
import { Router, Route, IndexRoute } from "react-router";
import { history } from "./store.js";
import App from "./components/App";
import Start from "./components/Start";
import ViewWrapper from "./components/ViewWrapper";
import NotFound from "./components/NotFound";

// build the router
const router = (
  <Router onUpdate={() => window.scrollTo(0, 0)} history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Start}/>
      <Route path="/view/:id" component={ViewWrapper} />
      <Route path="*" component={NotFound}/>
    </Route>
  </Router>
);

// export
export { router };
