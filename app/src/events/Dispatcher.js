import d3 from 'd3';

const Dispatcher = {
  events: {
    navigateVideo: 'navigateVideo',
    stopVideo: 'stopVideo'
  },

  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
  },

  unsubscribe(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  },

  trigger(event, ...args) {
    this.listeners.forEach(listener => {
      listener.onDispatch(event, ...args);
    })
  }
};

export default Dispatcher;
