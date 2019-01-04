import React from "react";
import "../stylesheets/components/view-viewer.scss";
import "aframe";
import { store } from "../store";
import axios from 'axios';
import $ from 'jquery';
import Websocket from "../classes/Websocket";
import {computeNewState} from "../reducers/data";

const jQuery = $;

const flatten = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

export default class ViewViewer extends React.Component {
  constructor(props){
    super(props);

    this.isVr = false;
    this.isMobile = window['AFRAME']['utils']['device']['isMobile']();
    this.websocket = null;
    this.needInitMessage = true;
    this.environmentId = null;

    this.scene = null;
    this.setSceneContainer = element => this.scene = element;
    this.clickSound = null;
    this.setClickSound = element => this.clickSound = element;
    this.povContainer = null;
    this.setPovContainer = element => this.povContainer = element;
    this.imgContainer = null;
    this.setImgContainer = element => this.imgContainer = element;
    this.hsPovContainer = null;
    this.setHsPovContainer = element => this.hsPovContainer = element;
    this.hsConfigContainer = null;
    this.setHsConfigContainer = element => this.hsConfigContainer = element;
    this.hsAboutContainer = null;
    this.setHsAboutContainer = element => this.hsAboutContainer = element;

    this.environmentData = {
      environments: {},
      povs: {},
      objects: {},
      configurations: {},
      images: {},
      hotspots: {},
      positions: {},
      abouts: {},
      full: false
    };

    this.pro = false;
    this.remotePov = false;
    this.povId = null;
    this.imagesLoaded = {};
    this.povsLoaded = {};
    this.controllers = {};
    this.buttonsStatus = {};
  }

  // render
  render() {
    let resetFocusIcon = null;
    if (this.isMobile) {
      resetFocusIcon = <img onClick={(e) => this.onFocusResetBtn()} className="reset-focus" />;
    }
    return (
      <div id="view-viewer-cmp">
        <a-scene ref={this.setSceneContainer} onWheel={(e) => this.onWheel(e)} onPanup={(e) => this.onPan(e, true)} onPandown={(e) => this.onWheel(e, false)}>
          <a-assets>
            <audio id="click-sound" src="/assets/audio/click.mp3" ref={this.setClickSound}></audio>
            <img id="pov-hotspot" src="/assets/images/pov_hotspot.png" />
            <img id="config-hotspot" src="/assets/images/config_hotspot.png" />
            <img id="about-hotspot" src="/assets/images/about_hotspot.png" />
            <img id="bg" src="/assets/images/adacto_bg_new.jpg" />
            <img id="vuoto" src="/assets/images/vuoto_bg.png" />
          </a-assets>
          <a-entity position="0 0 0">
            <a-camera wasd-controls-enabled="false" look-controls="reverseMouseDrag: true">
              <a-cursor
                material="color: #D5EE00;"
                id="cursor">
              </a-cursor>
            </a-camera>
          </a-entity>
          <a-sphere
            geometry="primitive:sphere; radius: 5000; segmentsWidth: 250; segmentsHeight: 250;"
            position="0 0 0"
            scale="1 1 -1"
            material="transparent:false; shader: flat; fog: false; src: #bg;">
          </a-sphere>
          <a-entity ref={this.setPovContainer}></a-entity>
          <a-entity ref={this.setImgContainer}></a-entity>
          <a-entity ref={this.setHsPovContainer}></a-entity>
          <a-entity ref={this.setHsConfigContainer}></a-entity>
          <a-entity ref={this.setHsAboutContainer}></a-entity>
          <div className="zoom-buttons-container">
            <img src="/assets/images/back_icon.png" onClick={(e) => this.onBackBtn()} className="back" />
            <img src="/assets/images/settings_icon.png" onClick={(e) => this.onSettingsBtn()} className="settings" />
            <img src="/assets/images/plus_icon.png" onClick={(e) => this.onZoomBtn(true)} className="plus" />
            <img src="/assets/images/minus_icon.png" onClick={(e) => this.onZoomBtn(false)} className="minus" />
            <img src="/assets/images/reset_zoom_icon.png" onClick={(e) => this.onZoomResetBtn()} className="reset-zoom" />
            {resetFocusIcon}
          </div>
        </a-scene>
      </div>
    );
  }

  componentDidMount(){
    if (this.scene.hasLoaded) {
      this._sceneLoadedHandler();
    }
    else {
      this.scene.addEventListener('loaded', this._sceneLoadedHandler.bind(this));
    }

    store.dispatch({
      type: 'VIEWER_SET_SESSION_TOKEN',
      payload: {
        sessionToken: this.props.token
      }
    });


    this.websocket = new Websocket(this.props.token, true);
    this.websocket.subscribe(
      (msg) => {
        if (msg.evt === 'init_environment' && this.needInitMessage) {
          this.needInitMessage = false;
          this._initEnvironmentHandling(msg.data);
        }
        if (msg.evt === 'set_viewer_data') {
          this._setViewerDataHandling(msg.data);
        }
        if (msg.evt === 'set_pov_data') {
          this._setPovDataHandling(msg.data);
        }
        if (msg.evt === 'set_configurations_data') {
          this._setConfigurationsDataHandling(msg.data);
        }
      }
    );
  }

  _sceneLoadedHandler(){
    this.scene.querySelector('a-cursor').addEventListener('click', this._cursorClick.bind(this));
    this.scene.addEventListener('enter-vr', () => {
      this.isVr = true;
      this._handleAboutHs(true);
      this.scene.querySelector('.zoom-buttons-container .plus').style.display = 'none';
      this.scene.querySelector('.zoom-buttons-container .minus').style.display = 'none';
      this.scene.querySelector('.zoom-buttons-container .reset-zoom').style.display = 'none';
      if (this.scene.querySelector('.zoom-buttons-container .reset-focus')) this.scene.querySelector('.zoom-buttons-container .reset-focus').style.display = 'none';
      if (this.scene.querySelector('.a-enter-vr-custom')) this.scene.querySelector('.a-enter-vr-custom').style.display = 'none';
      if (this.scene.querySelector('.a-exit-vr')) this.scene.querySelector('.a-exit-vr').style.display = 'block';
    });
    this.scene.addEventListener('exit-vr', () => {
      this.isVr = false;
      this._handleAboutHs(false);
      if (this.scene.querySelector('.a-enter-vr-custom')) this.scene.querySelector('.a-enter-vr-custom').style.display = 'block';
      this.scene.querySelector('.zoom-buttons-container .plus').style.display = 'block';
      this.scene.querySelector('.zoom-buttons-container .minus').style.display = 'block';
      this.scene.querySelector('.zoom-buttons-container .reset-zoom').style.display = 'block';
      if (this.scene.querySelector('.zoom-buttons-container .reset-focus')) this.scene.querySelector('.zoom-buttons-container .reset-focus').style.display = 'block';
      if (this.scene.querySelector('.a-exit-vr'))this.scene.querySelector('.a-exit-vr').style.display = 'none';
    });
    setInterval(
      () => {
        this._scanGamepads();
      },
      500
    );
  }

  _initEnvironmentHandling(msgData){
    if (msgData && msgData.success) {
      this.environmentId = msgData.data.environment;
      axios
        .get(store.getState().config.servicesUrl + 'environment-data/' + this.environmentId)
        .then(
          (responseData) => {
            let response = responseData.data;
            let action = {type: 'SET_CURRENT_ENVIRONMENT_DATA', payload: response};
            this.environmentData = computeNewState(this.environmentData, action);
            store.dispatch(action);
            this.environmentData.full = true;

            this.pro = msgData.data.pro;
            this.remotePov = msgData.data.remotePov;
            this.baseUrl = msgData.data.baseUrl;
            this.layersCount = msgData.data.layersCount;

            this.props.baseUrlEvt(this.baseUrl);
            this.props.environmentIdEvt(this.environmentId);

            this._setEnvironmentConfig(this.environmentData.environments[this.environmentId].config);
            this._refreshEnvironment(msgData.data.pov, msgData.data.configurations);
          }
        );
    }
  }

  _setEnvironmentConfig(config) {
    if (config && config.equirectangular && config.equirectangular.width && config.equirectangular.height) {
      this.panoramaWidth = config.equirectangular.width;
      this.panoramaHeight = config.equirectangular.height;
    } else {
      this.panoramaWidth = store.getState().config.panoramaWidth;
      this.panoramaHeight = store.getState().config.panoramaHeight;
    }
    let camera;
    camera = this.scene.querySelector('a-camera');
    camera.setAttribute('user-height', config.userHeight);
    camera.setAttribute('fov', config.fov);
  }

  _refreshEnvironment(povId, configurationIds) {
    if (this.layersCount) {
      jQuery('a-scene').addClass('loading');
      const startTimestamp = (new Date()).getTime();


      this._cleanHotspotsOnScene();

      let needRefreshPov = false;
      if (!this.povId || (this.povId !== povId)) {
        this.povId = povId;
        needRefreshPov = true;
      }
      if (configurationIds) {
        this.configurationIds = configurationIds;
        this.props.configurationIdsEvt(this.configurationIds);
      }

      const images = this._getImagesFromConfigurationIds();

      Promise.all(
        [
          this._prepareLayers(),
          this._preloadImages(images),
          this._preloadPov()
        ]
      ).then(
        () => {
          const currentTimestamp = (new Date()).getTime();
          const timeToWait = ((currentTimestamp - startTimestamp) > 500) ? 0 : (currentTimestamp - startTimestamp);
          setTimeout(
            () => {
              if (needRefreshPov) {
                this._refreshPov();
              }
              this._refreshConfigurations(images);
            }, timeToWait
          );
          setTimeout(
            () => {
              jQuery('a-scene').removeClass('loading');
              // this._addHotspotsOnScene(msgData);
              this._addHotspotsOnScene();
            }, timeToWait + 500
          );
        }
      );
    }
  }

  _addHotspotsOnScene() {
    if (
      this.hsPovContainer && this.hsConfigContainer && this.hsAboutContainer
    ) {
      let hsPovContainerEl, hsConfigContainerEl, hsAboutContainerEl;
      hsPovContainerEl = this.hsPovContainer;
      hsConfigContainerEl = this.hsConfigContainer;
      hsAboutContainerEl = this.hsAboutContainer;

      const hotspots = [];
      if (this.environmentData.povs.hasOwnProperty(this.povId)) {
        const pov = this.environmentData.povs[this.povId],
          positions = pov.positions.map(
            (id) => {
              if (this.environmentData.positions.hasOwnProperty(id)) {
                if (this.environmentData.positions[id].hotspots) {
                  return this.environmentData.positions[id];
                }
              }
            }
          );
        positions.forEach(
          (hotspotPosition) => {
            if (hotspotPosition.hotspots && hotspotPosition.hotspots.length > 0) {
              const hotspot = this.environmentData.hotspots[hotspotPosition.hotspots[0]],
                hotspotObj = {
                  type: hotspot.type,
                  target: hotspot.target,
                  x: hotspotPosition.x,
                  y: hotspotPosition.y
                };
              hotspots.push(hotspotObj);
            }
          }
        );

        if (hotspots && hotspots.length > 0) {
          for (const i in hotspots) {
            if (hotspots.hasOwnProperty(i)) {
              const currHsData = hotspots[i];
              // if (currHsData.type=="config_obj" || currHsData.type=="about_obj") return;
              let hs;
              hs = document.createElement('a-entity');
              hs.setAttribute('geometry', {
                primitive: 'plane',
                height: 24,
                width: 24
              });
              let imgSrc;
              if (currHsData.type === 'change_pov') {
                imgSrc = '#pov-hotspot';
              }
              if (currHsData.type === 'config_obj') {
                imgSrc = '#config-hotspot';
              }
              if (currHsData.type === 'about_obj') {
                imgSrc = '#about-hotspot';
              }
              hs.setAttribute('material', {
                shader: 'flat',
                transparent: true,
                visible: (!(this.isVr && currHsData.type === 'about_obj')),
                fog: false,
                src: imgSrc,
                side: 'back'
              });
              // hs.setAttribute('sound', 'on: click; src: #click-sound');
              hs.setAttribute('data-type', currHsData.type);
              hs.setAttribute('data-target', currHsData.target);
              hs.setAttribute('position', '99999 99999 99999');
              hs.setAttribute('rotation', this._getRotationFromEquirectangularCoordinates(currHsData.x, currHsData.y));
              if (currHsData.type === 'change_pov') {
                hsPovContainerEl.appendChild(hs);
              }
              if (currHsData.type === 'config_obj') {
                hsConfigContainerEl.appendChild(hs);
              }
              if (currHsData.type === 'about_obj') {
                hsAboutContainerEl.appendChild(hs);
              }
              setTimeout(
                () => {
                  hs.setAttribute('position', this._getPositionFromEquirectangularCoordinates(currHsData.x, currHsData.y));
                }, 500
              );
            }
          }
        }
      }
    }
  }

  _getVectorFromEquirectangularCoordinates(x, y) {
    const phi = (x / (this.panoramaWidth / 360)) - 180; // theta h lon [-180, +180]
    const theta = ((y / (this.panoramaHeight / 180)) - 90) / -1; // phi v lat [-90,+90]

    const v_x = -store.getState().config.hotspotLayerRadius * Math.sin(theta / 180 * Math.PI) * Math.cos(phi / 180 * Math.PI);
    const v_y = store.getState().config.hotspotLayerRadius * Math.cos(theta / 180 * Math.PI);
    const v_z = -store.getState().config.hotspotLayerRadius * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);

    return Object.assign({}, {x: v_x, y: v_y, z: v_z});
  }

  _getPositionFromEquirectangularCoordinates(x, y) {
    const vector = this._getVectorFromEquirectangularCoordinates(x, y);
    return vector.x + ' ' + vector.y + ' ' + vector.z;
  }

  _getRotationFromEquirectangularCoordinates(x, y) {
    const vector = this._getVectorFromEquirectangularCoordinates(x, y);

    const modulus = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    const roll = -1 * Math.asin(vector.y / modulus) * (180 / Math.PI);
    const pitch = Math.atan2(vector.x / modulus, vector.z / modulus) * (180 / Math.PI);
    const yaw = 0;

    return roll + ' ' + pitch + ' ' + yaw;
  }

  _refreshConfigurations(images) {
    const imgContainerEl = this.imgContainer,
      imgContainerArray = imgContainerEl.querySelectorAll('a-sphere');

    for (const i in imgContainerArray) {
      if (imgContainerArray.hasOwnProperty(i)) {
        if (images[i]) {
          imgContainerArray[i].setAttribute('material', {src: this.baseUrl + images[i].path});
        } else {
          imgContainerArray[i].setAttribute('material', {src: store.getState().config.transparentLayerSrcPath});
        }
      }
    }
  }

  _refreshPov() {
    if (this.environmentData && this.environmentData.povs) {
      const pov = this.environmentData.povs[this.povId],
        povContainerEl = this.povContainer,
        povContainerArray = povContainerEl.querySelectorAll('a-sphere');

      if (povContainerArray && povContainerArray.hasOwnProperty(0)) {
        povContainerArray[0].setAttribute('material', {src: this.baseUrl + pov.path});
      }

      let camera;
      camera = this.scene.querySelector('a-camera');
      camera.setAttribute('rotation', this._getCameraRotationFromEquirectangularCoordinates(pov.focus_x, pov.focus_y));
    }
  }

  _getCameraRotationFromEquirectangularCoordinates(x, y) {
    const phi = (x / (this.panoramaWidth / 360)) - 180; // theta h lon [-180, +180]
    const theta = ((y / (this.panoramaHeight / 180)) - 90) / -1; // phi v lat [-90,+90]

    const v_x = -store.getState().config.hotspotLayerRadius * Math.sin(theta / 180 * Math.PI) * Math.cos(phi / 180 * Math.PI);
    const v_y = store.getState().config.hotspotLayerRadius * Math.cos(theta / 180 * Math.PI);
    const v_z = -store.getState().config.hotspotLayerRadius * Math.sin(theta / 180 * Math.PI) * Math.sin(phi / 180 * Math.PI);

    const vector = Object.assign({}, {x: v_x, y: v_y, z: v_z});

    const modulus = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    const roll = Math.asin(vector.y / modulus) * (180 / Math.PI);
    const pitch = Math.atan2(vector.x / modulus, vector.z / modulus) * (180 / Math.PI);
    const yaw = 0;

    return roll + ' ' + (pitch - 180) + ' ' + yaw;
  }

  _preloadPov() {
    const imagePreloadArray = [];
    return new Promise(
      (resolve, reject) => {
        for (const i in this.environmentData.povs) {
          if (this.environmentData.povs.hasOwnProperty(i)) {
            const pov = this.environmentData.povs[i];
            if (!this.povsLoaded[pov.id]) {
              imagePreloadArray.push({id: pov.id, path: this.baseUrl + pov.path, type: 'pov'});
            }
            Promise.all(imagePreloadArray.map(this._preloadImage))
              .then(
                (returnArray) => {
                  if (returnArray.length === 0) {
                    resolve();
                  } else {
                    returnArray.forEach(
                      (item) => {
                        if (item.type === 'pov') {
                          this.povsLoaded[item.id] = true;
                        }
                      }
                    );
                    resolve();
                  }
                }
              )
              .catch(
                (error) => {
                  console.error('preload_images_promise', error);
                  reject();
                }
              );
          }
        }
      }
    );
  }

  _prepareLayers() {
    return new Promise(
      (resolve, reject) => {
        const povContainerEl = this.povContainer,
          imgContainerEl = this.imgContainer,
          povContainerArray = povContainerEl.querySelectorAll('a-sphere'),
          imgContainerArray = imgContainerEl.querySelectorAll('a-sphere');
        if ((povContainerArray.length + imgContainerArray.length) !== this.layersCount) {
          // clean old layers
          while (povContainerEl.firstChild) {
            povContainerEl.removeChild(povContainerEl.firstChild);
          }
          while (imgContainerEl.firstChild) {
            imgContainerEl.removeChild(imgContainerEl.firstChild);
          }
          // make new layers
          for (let i = this.layersCount - 1; i > 0; i--) {
            let forLayer;
            forLayer = document.createElement('a-sphere');

            forLayer.setAttribute('position', {
              x: 0, y: 0, z: 0
            });
            forLayer.setAttribute('scale', {
              x: 1, y: 1, z: -1
            });
            forLayer.setAttribute('geometry', {
              segmentsWidth: 250,
              segmentsHeight: 250,
              radius: store.getState().config.nearLayerRadius + (store.getState().config.layerRadiusIncrement * i)
            });

            imgContainerEl.appendChild(forLayer);
            forLayer.setAttribute('material', {
              transparent: true,
              shader: 'flat',
              src: store.getState().config.transparentLayerSrcPath
            });
            forLayer.setAttribute('side', 'back');
          }
          let layer;
          layer = document.createElement('a-sphere');

          layer.setAttribute('position', {
            x: 0, y: 0, z: 0
          });
          layer.setAttribute('scale', {
            x: 1, y: 1, z: -1
          });
          layer.setAttribute('geometry', {
            segmentsWidth: 250,
            segmentsHeight: 250,
            radius: store.getState().config.nearLayerRadius + (store.getState().config.layerRadiusIncrement * this.layersCount - 1)
          });
          povContainerEl.appendChild(layer);
          layer.setAttribute('material', {
            transparent: false,
            shader: 'flat',
            src: store.getState().config.transparentLayerSrcPath
          });
          layer.setAttribute('side', 'back');
        }
        resolve();
      }
    );
  }

  _preloadImages(images) {
    return new Promise(
      (resolve, reject) => {
        const imagePreloadArray = [];
        for (const i in images) {
          if (images.hasOwnProperty(i)) {
            const image = images[i];
            if (!this.imagesLoaded[image.id]) {
              imagePreloadArray.push({id: image.id, path: this.baseUrl + image.path, type: 'image'});
            }
          }
        }

        Promise.all(imagePreloadArray.map(this._preloadImage))
          .then(
            (returnArray) => {
              if (returnArray.length === 0) {
                resolve();
              } else {
                returnArray.forEach(
                  (item) => {

                    if (item.type === 'image') {
                      this.imagesLoaded[item.id] = true;
                    }
                  }
                );
                resolve();
              }
            }
          )
          .catch(
            (error) => {
              console.error('preload_images_promise', error);
              reject();
            }
          );
      }
    );
  }

  _preloadImage(value) {
    return new Promise(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          resolve({type: value.type, id: value.id});
        };
        image.onerror = () => {
          reject({type: value.type, id: value.id});
        };
        image.src = value.path;
      }
    );
  }

  _getImagesFromConfigurationIds(povId) {
  if (!povId) {
    povId = this.povId;
  }
  return flatten(
    this.configurationIds
      .map(
        (configurationId) => {
          if (this.environmentData.configurations.hasOwnProperty(configurationId)) {
            return this.environmentData.configurations[configurationId].images
              .map(
                (imageId) => {
                  if (this.environmentData.images.hasOwnProperty(imageId)) {
                    return this.environmentData.images[imageId];
                  }
                }
              )
              .filter(
                (image) => {
                  return (image.povs && image.povs.length > 0 && image.povs[0] && image.povs[0] && image.povs[0] === povId);
                }
              );
          }
        }
      )
  )
    .map(
      (image) => {
        return {
          id: image.id,
          path: image.path
        };
      }
    );
}

  _cleanHotspotsOnScene() {
    if (
      this.hsPovContainer && this.hsConfigContainer && this.hsAboutContainer
    ) {
      let hsPovContainerEl, hsConfigContainerEl, hsAboutContainerEl;
      hsPovContainerEl = this.hsPovContainer;
      hsConfigContainerEl = this.hsConfigContainer;
      hsAboutContainerEl = this.hsAboutContainer;
      while (hsPovContainerEl.firstChild) {
        hsPovContainerEl.removeChild(hsPovContainerEl.firstChild);
      }
      while (hsConfigContainerEl.firstChild) {
        hsConfigContainerEl.removeChild(hsConfigContainerEl.firstChild);
      }
      while (hsAboutContainerEl.firstChild) {
        hsAboutContainerEl.removeChild(hsAboutContainerEl.firstChild);
      }
    }
  }

  _handleAboutHs(entering){
    if (this.hsAboutContainer) {
      Array.from(this.hsAboutContainer.childNodes).forEach(
        (item) => {
          const a = item;
          a.setAttribute('material', 'visible', !entering);
        }
      );
    }
  }

  _cursorClick(evt){
    if (evt && evt.detail && evt.detail.intersectedEl) {
      const clickedEl = evt.detail.intersectedEl;
      const type = clickedEl.dataset['type'],
        target = parseInt(clickedEl.dataset['target'], 10);
      this._cursorClickHandler(type, target);
    }
  }

  _cursorClickHandler(type, target) {
    if (type === 'change_pov') {
      this._changePov(target);
    }
    if (type === 'config_obj') {
      this._configObj(target);
    }
    if (type === 'about_obj') {
      this._aboutObj(target);
    }
  }

  _aboutObj(target){
    this.props.hotspotEvt({type: 'about', target: target});
  }

  _configObj(target) {
    const configData = {
      obj: target
    };
    if (this.isVr) {
      /*const msg = {
        evt: 'change_obj_config',
        data: configData
      };*/
      this.websocket.emit('change_obj_config', configData);//messageSend.next(msg);
    } else {
      if (this.pro) {
        // notifico al wrapper di aprire il pannello laterale
        this.props.hotspotEvt({type: 'config', target: target});

      } else {
        /*const msg = {
          evt: 'change_obj_config',
          data: configData
        };*/
        this.websocket.emit('change_obj_config', configData)//.messageSend.next(msg);
      }
    }
  }

  _changePov(target) {
    if (!this.remotePov) {
      this._refreshEnvironment(target);
    } else {
      const configData = {
        pov: target
      };
      /*const msg = {
        evt: 'set_new_pov',
        data: configData
      };*/
      this.websocket.emit('set_new_pov', configData);//messageSend.next(msg);
    }
  }

  _scanGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator['webkitGetGamepads'] ? navigator['webkitGetGamepads']() : []);
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        if (!(gamepads[i].id in this.controllers)) {
          this._addGamepad(gamepads[i]);
        } else {
          this.controllers[gamepads[i].id] = gamepads[i];
        }
      }
    }
  }

  updateGamepadStatus() {
    this._scanGamepads();
    for (const j in this.controllers) {
      if (this.controllers.hasOwnProperty(j) && j === 'Oculus Remote') {
        const controller = this.controllers[j];
        for (const i in controller.buttons) {
          if (controller.buttons.hasOwnProperty(i)) {
            const button = controller.buttons[i];
            if (!this.buttonsStatus[j]) {
              this.buttonsStatus[j] = {};
            }
            if (!this.buttonsStatus[j][i]) {
              console.error("NOT IMPLEMENTED");
              /*this.buttonsStatus[j][i] = new Rx.Subject<any>();
              this.buttonsStatus[j][i]
                .distinctUntilChanged(function (a, b) {
                  return a === b;
                }, function (x) {
                  return x.value;
                })
                .skip(1)
                .subscribe(
                  (obj) => {
                    if (obj.value === 0) {
                      this._gamepadButtonUp(obj.id);
                    } else {
                      this._gamepadButtonDown(obj.id);
                    }
                  }
                );*/
            }
            this.buttonsStatus[j][i].next({value: button.value, id: i});
          }
        }
      }

    }
    let rAF = window['mozRequestAnimationFrame '] || window['webkitRequestAnimationFrame'] || window['requestAnimationFrame'];
    rAF(this.updateGamepadStatus.bind(this));
  }

  _gamepadButtonUp(btnId) {
    switch (btnId) {
      case '2':
        clearInterval(this.zoomInInterval);
        this.zoomInInterval = null;
        break;
      case '3':
        clearInterval(this.zoomOutInterval);
        this.zoomOutInterval = null;
        break;
      case '1':
        this.onZoomResetBtn();
        break;
      case '0':
        if (this.scene.querySelector('a-cursor').components.cursor.intersectedEl) {
          this._cursorClickHandler(this.scene.querySelector('a-cursor').components.cursor.intersectedEl.dataset.type, this.scene.querySelector('a-cursor').components.cursor.intersectedEl.dataset.target);
          // this.sceneContainer.element.nativeElement.querySelector('a-cursor').components.cursor.intersectedEl.dataset;
        }
        break;
    }
  }

  _gamepadButtonDown(btnId) {
    switch (btnId) {
      case '2':
        this.zoomInInterval = setInterval(
          () => {
            let camera;
            camera = this.scene.querySelector('a-camera');
            let fov = parseInt(camera.getAttribute('fov'), 10);
            if (fov < 30) {
              return;
            }
            fov -= 2.5;
            camera.setAttribute('fov', fov);
          }, 50
        );
        break;
      case '3':
        this.zoomOutInterval = setInterval(
          () => {
            let camera;
            camera = this.scene.querySelector('a-camera');
            let fov = parseInt(camera.getAttribute('fov'), 10);
            if (fov > 130) {
              return;
            }
            fov += 2.5;
            camera.setAttribute('fov', fov);
          }, 50
        );
        break;
    }
  }

  _addGamepad(gamepad) {
    this.controllers[gamepad.id] = gamepad;
    let rAF = window['mozRequestAnimationFrame '] || window['webkitRequestAnimationFrame'] || window['requestAnimationFrame'];
    rAF(this.updateGamepadStatus.bind(this));
  }

  onBackBtn(){
    this.props.backEvt(true);
  }

  onSettingsBtn(){
    this.props.settingsEvt(this.remotePov);
  }

  onZoomBtn(plus){
    let camera;
    camera = this.scene.querySelector('a-camera');
    let fov = parseInt(camera.getAttribute('fov'), 10);
    if (!plus) {
      if (fov > 130) {
        return;
      }
      fov += 5;
    } else {
      if (fov < 30) {
        return;
      }
      fov -= 5;
    }
    camera.setAttribute('fov', fov);
  }

  onZoomResetBtn(){
    let camera;
    camera = this.scene.querySelector('a-camera');
    camera.setAttribute('fov', this.environmentData.environments[this.environmentId].config.fov);
  }

  onVrEnterBtn(){
    this.props.enterVrEvt(true);
  }

  onVrExitBtn(){
    this.props.enterVrEvt(false);
  }

  onWheel(evt) {
    if (evt && evt.deltaY !== 0 && this.scene && this.scene.querySelector('a-camera')) {
      let camera;
      camera = this.scene.querySelector('a-camera');
      let fov = parseInt(camera.getAttribute('fov'), 10);
      if (evt.deltaY > 0) {
        if (fov > 130) {
          return;
        }
        fov += 2;
      } else {
        if (fov < 30) {
          return;
        }
        fov -= 2;
      }
      camera.setAttribute('fov', fov);
    }
  }

  onPan(evt, vertical) {
    if (this.scene) {
      let scene;
      scene = this.scene;
      if (scene.isMobile) {
        let camera;
        camera = scene.querySelector('a-camera');
        let fov = parseInt(camera.getAttribute('fov'), 10);
        if (!vertical) {
          if (fov > 130) {
            return;
          }
          fov += 3;
        } else {
          if (fov < 30) {
            return;
          }
          fov -= 3;
        }
        camera.setAttribute('fov', fov);
      }
    }
  }
}
