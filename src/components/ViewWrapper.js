import React from "react";
import "../stylesheets/components/view-wrapper.scss";
import ViewViewer from "./ViewViewer";


export default class ViewWrapper extends React.Component {
  constructor(props){
    super(props);

    this.baseUrl = null;
    this.environmentId = null;

    this.viewViewer = null;
    this.setViewViewer = element => this.viewViewer = element;
  }

  // render
  render() {
    return (
      <div id="viewer-wrapper-cmp">
        <div className="toolbar">
          <img src="/assets/images/adacto360_logo.png" className="logo" />
        </div>
        <div className="content">
          <ViewViewer
            token={this.props.routeParams.id}
            baseUrlEvt={this.baseUrlCb.bind(this)}
            environmentIdEvt={this.environmentIdCb.bind(this)}
            configurationIdsEvt={this.configurationIdsCb.bind(this)}
            hotspotEvt={this.hotspotCb.bind(this)}
            backEvt={this.backCb.bind(this)}
            settingsEvt={this.settingsCb.bind(this)}
            enterVrEvt={this.enterVrCb.bind(this)}
            ref={this.setViewViewer}
          />
        </div>
      </div>
    );
  }

  baseUrlCb(baseUrl){
    this.baseUrl = baseUrl;
  }
  environmentIdCb(environmentId){
    this.environmentId = environmentId;
  }
  configurationIdsCb(configurationIds){

  }
  hotspotCb(configurationIds){

  }
  backCb(back){

  }
  settingsCb(settings){

  }
  enterVrCb(entering){
    if (entering) {
      this.viewViewer.scene.enterVR();
      /*if (this.viewViewer.querySelector('a-scene')['systems']['tracked-controls']['vrDisplay']) {
        this.onSettings(this.appViewViewerObject.remotePov);
      }*/
    } else {
      this.viewViewer.scene.exitVR();
    }
  }
}
