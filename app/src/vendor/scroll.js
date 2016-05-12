/**
 * From https://github.com/mkay581/scroll-js

The MIT License (MIT)

Copyright (c) 2015 Mark Kennedy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

'use strict';
import Promise from 'promise';

/**
 * Map to hold easing functions.
 * @type {Object}
 */
let animMap = {
    linear: function (t) { return t },
    easeInQuad: function (t) { return t*t },
    easeOutQuad: function (t) { return t*(2-t) },
    easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
    easeInCubic: function (t) { return t*t*t },
    easeOutCubic: function (t) { return (--t)*t*t+1 },
    easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
    easeInQuart: function (t) { return t*t*t*t },
    easeOutQuart: function (t) { return 1-(--t)*t*t*t },
    easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
    easeInQuint: function (t) { return t*t*t*t*t },
    easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
    easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};

/**
 * Gets an easing function based on supplied easing string.
 * @param {String} easing - The easing id
 * @returns {Function} - Returns the easing function
 */
let getEasing = (easing) => {
    var defaultEasing = 'linear',
        easeFunc = animMap[easing || defaultEasing];
    if (!easeFunc) {
        console.warn('Scroll error: scroller does not support an easing option of ' + easing + '. Using "' + defaultEasing + '" instead');
        easeFunc = animMap[easing];
    }
    return easeFunc;
};

/**
 * Scroll class.
 * @class Scroll
 * @param {object} options - Options to pass
 * @param {HTMLElement} options.el - The element to apply scroll to
 */
class Scroll {

    /**
     * When the scroll is instantiated.
     * @param {HTMLElement} el - The element to scroll (the viewport)
     */
    constructor (el) {
        if (!el) {
            console.error('Scroll error: element passed to Scroll constructor is ' + el + '! Bailing...');
        }
        this.el = el;
    }

    /**
     * Scrolls the element until it's scroll properties match the coordinates provided.
     * @param {Number} x - The pixel along the horizontal axis of the element that you want displayed in the upper left.
     * @param {Number} y - The pixel along the vertical axis of the element that you want displayed in the upper left.
     * @param {Object} [options] - Scroll options
     * @param {Number} [options.duration]- The amount of time for the animation
     * @param {string} [options.easing] - The easing function to use
     * @return {Promise}
     */
    to (x, y, options) {
        var elem = this.el,
            fromY = elem.scrollTop,
            fromX = elem.scrollLeft;
        // defaults
        options = options || {};
        options.duration = options.duration || 400;

        /**
         * Sets element's property to a value.
         * @param {string} prop - The property to set
         * @param {Number} value - The number value
         */
        let moveElement = (prop, value) => {
            var el = this.el;
            el[prop] = value;
            // scroll the html element also for cross-browser compatibility
            // (ie. silly browsers like IE who need the html element to scroll too)
            if (el === this.document.body) {
                this.document.documentElement[prop] = value;
            }
        };

        /**
         * Does a bit of calculating and scrolls an element.
         * @param {HTMLElement} el - The element to be scrolled
         * @param {Number} from - The number of where to scroll from
         * @param {Number} to - The number of where to scroll to
         * @param {string} prop - The property to animate
         * @param {Number} startTime - The timestamp of when the animation should start
         * @param {Number} duration - The amount of time for the animation
         * @param {Function} easeFunc - The easing function to use
         * @param [callback]
         */
        let scroll = (el, from, to, prop, startTime, duration, easeFunc, callback) => {
            window.requestAnimationFrame(() => {
                var currentTime = Date.now(),
                    time = Math.min(1, ((currentTime - startTime) / duration));

                if (from === to) {
                    return callback ? callback() : null;
                }

                moveElement(prop, (easeFunc(time) * (to - from)) + from);

                /* prevent scrolling, if already there, or at end */
                if (time < 1) {
                    scroll(el, el[prop], to, prop, startTime, duration, easeFunc, callback);
                } else if (callback) {
                    callback();
                }
            });
        };

        return new Promise((resolve) => {
            scroll(elem, fromY, y, 'scrollTop', Date.now(), options.duration, getEasing(options.easing), resolve);
        });
    }

    /**
     * Returns document element
     * @returns {HTMLDocument}
     */
    get document () {
        return document;
    }

    /**
     * Scroll to an element.
     * @param {HTMLElement} el - The element to scroll to.
     * @param {Object} [options] - The scroll options
     */
    toElement (el, options) {
        var container = this.el,
            currentContainerScrollYPos = 0,
            elementScrollYPos =  el ? el.offsetTop : 0,
            errorMsg;

        if (!el) {
            errorMsg = 'The element passed to Scroll.toElement() was undefined';
            console.error(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }
        if (!container.contains(el)) {
            errorMsg = 'Scroll.toElement() was passed an element that does not exist inside the scroll container';
            console.warn(errorMsg);
            return Promise.reject(new Error(errorMsg));
        }

        // if the container is the document body or document itself, we'll
        // need a different set of coordinates for accuracy
        if (container === document.body) {
            // using pageYOffset for cross-browser compatibility
            currentContainerScrollYPos = window.pageYOffset;
            // must add containers scroll y position to ensure an absolute value that does not change
            elementScrollYPos = el.getBoundingClientRect().top + currentContainerScrollYPos;
        }

        return this.to(0, elementScrollYPos, options);
    }

    /**
     * Use this to clean up the DOM when done.
     */
    destroy () {}

}

module.exports = Scroll;
