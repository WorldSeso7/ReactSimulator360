import React from "react";
import "../stylesheets/components/start.scss";
import { store } from "../store";
import axios from 'axios';
import { push } from 'react-router-redux';

// Home page component
export default class Start extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
    };
  }
  // render
  render() {
    let contentItems = this.state.data.map(
      (item) => {
        return (
          <div key={item.id} className="environment-preview-container" style={ {backgroundImage: 'url(\''+item.preview+'\')' } } onClick={(e) => this.onEnvironmentClick(item, e)}>
            <div className="shadow-container">
              <div className="text-container">
                <div className="name">{item.name}</div>
                <div className="description">{item.description}</div>
              </div>
            </div>
          </div>
        );
      }
    );
    return (
      <div id="start-cmp">
        <div className="toolbar">
          <img src="/assets/images/adacto360_logo.png" className="logo" />
        </div>
        <div className="content">
          {contentItems}
        </div>
      </div>
    );
  }

  componentDidMount(){
    axios
      .get(store.getState().config.servicesUrl+'sessions-and-environments')
      .then(
        (response) => {
          if (response && response.data && response.data.success) {
            this.setState({
              data: response.data.data
            });
          }
        }
      );
  }

  onEnvironmentClick(environment, event){
    store.dispatch(push('/view/'+environment.token));
  }
}
