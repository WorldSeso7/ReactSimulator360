import io from 'socket.io-client';
import { store } from '../store';

function subscribeToTimer(cb) {
  socket.on('timer', timestamp => cb(null, timestamp));
  socket.emit('subscribeToTimer', 1000);
}
export { subscribeToTimer };

export default class Websocket {
  constructor(key, viewerMode = false){
    this.key = key;
    this.viewerMode = viewerMode;
    this.connected = false;

    this.socket = io(store.getState().config.wsUrl);
    this.socket.on('connect', this.connectedCallback.bind(this));
    // this.socket.on('message', this.messageCallback.bind(this));
    this.socket.on('disconnect', this.disconnectedCallback.bind(this));
  }

  subscribe(cb){
    this.socket.on('message', (data) => cb(data));
  }

  emit(evt, data){
    this.socket.emit({
      key: this.key,
      evt: evt,
      data: data
    });
  }

  connectedCallback(){
    this.connected = true;
    if (this.viewerMode) {
      this.channelSubscribe();
    }
    window['client'] = this._client;
  }

  disconnectedCallback(){
    this.connected = false;
  }

  channelSubscribe(){
    if (this.key && this.socket) {
      this.socket.emit('sub', this.key);
    }
  }
}
