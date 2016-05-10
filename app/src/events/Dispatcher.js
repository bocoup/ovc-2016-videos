import d3 from 'd3';

const Dispatcher = {
  events: {
    navigateVideo: 'navigateVideo'
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
    console.log('triggered event', event, args);
    this.listeners.forEach(listener => {
      listener.onDispatch(event, ...args);
    })
  }
};

console.log('Dispatcher =', Dispatcher);

export default Dispatcher;
