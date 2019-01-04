// users reducer
export default function config(state = {
  panoramaHeight: 2048,
  panoramaWidth: 4096,
  hotspotLayerRadius: 275,
  nearLayerRadius: 300,
  layerRadiusIncrement: 100,
  transparentLayerSrcPath: '/assets/images/vuoto_bg.png',
  /*wsUrl: 'http://192.168.1.80:3000',
  servicesUrl: 'http://pc-30080/api/',
  wsUrl: 'http://localhost:3000',
  servicesUrl: 'http://localhost/realtime/public/api/',*/
  wsUrl: 'https://socket.simulator360-backend.adacto.it/',
  servicesUrl: 'https://simulator360-backend.adacto.it/api/',
}, action) {
  return state;
}
