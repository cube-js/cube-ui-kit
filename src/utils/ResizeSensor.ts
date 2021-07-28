// @ts-nocheck

// https://github.com/marcj/css-element-queries/blob/master/src/ResizeSensor.js
// https://github.com/Semantic-Org/Semantic-UI/issues/3855
// https://github.com/marcj/css-element-queries/issues/257
let globalWindow = window;
// Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
// In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
// would generate too many unnecessary events.
let requestAnimationFrame =
  globalWindow.requestAnimationFrame ||
  globalWindow.mozRequestAnimationFrame ||
  globalWindow.webkitRequestAnimationFrame ||
  function (fn) {
    return globalWindow.setTimeout(fn, 20);
  };

let cancelAnimationFrame =
  globalWindow.cancelAnimationFrame ||
  globalWindow.mozCancelAnimationFrame ||
  globalWindow.webkitCancelAnimationFrame ||
  function (timer) {
    globalWindow.clearTimeout(timer);
  };

/**
 * Iterate over each of the provided element(s).
 *
 * @param {HTMLElement|HTMLElement[]} elements
 * @param {Function}                  callback
 */
function forEachElement(elements, callback) {
  let elementsType = Object.prototype.toString.call(elements);
  let isCollectionTyped =
    '[object Array]' === elementsType ||
    '[object NodeList]' === elementsType ||
    '[object HTMLCollection]' === elementsType ||
    '[object Object]' === elementsType ||
    ('undefined' !== typeof jQuery && elements instanceof jQuery) || //jquery
    ('undefined' !== typeof Elements && elements instanceof Elements); //mootools
  let i = 0,
    j = elements.length;
  if (isCollectionTyped) {
    for (; i < j; i++) {
      callback(elements[i]);
    }
  } else {
    callback(elements);
  }
}

/**
 * Get element size
 * @param {HTMLElement} element
 * @returns {Object} {width, height}
 */
function getElementSize(element) {
  if (!element.getBoundingClientRect) {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  }

  let rect = element.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/**
 * Apply CSS styles to element.
 *
 * @param {HTMLElement} element
 * @param {Object} style
 */
function setStyle(element, style) {
  Object.keys(style).forEach(function (key) {
    element.style[key] = style[key];
  });
}

/**
 * Class for dimension change detection.
 *
 * @param {Element|Element[]|Elements|jQuery} element
 * @param {Function} callback
 *
 * @constructor
 */
export let ResizeSensor = function (element, callback) {
  //Is used when checking in reset() only for invisible elements
  let lastAnimationFrameForInvisibleCheck = 0;

  /**
   *
   * @constructor
   */
  function EventQueue() {
    let q = [];
    this.add = function (ev) {
      q.push(ev);
    };

    let i, j;
    this.call = function (sizeInfo) {
      for (i = 0, j = q.length; i < j; i++) {
        q[i].call(this, sizeInfo);
      }
    };

    this.remove = function (ev) {
      let newQueue = [];
      for (i = 0, j = q.length; i < j; i++) {
        if (q[i] !== ev) newQueue.push(q[i]);
      }
      q = newQueue;
    };

    this.length = function () {
      return q.length;
    };
  }

  /**
   *
   * @param {HTMLElement} element
   * @param {Function}    resized
   */
  function attachResizeEvent(element, resized) {
    if (!element) return;
    if (element.resizedAttached) {
      element.resizedAttached.add(resized);
      return;
    }

    element.resizedAttached = new EventQueue();
    element.resizedAttached.add(resized);

    element.resizeSensor = document.createElement('div');
    element.resizeSensor.dir = 'ltr';
    element.resizeSensor.className = 'resize-sensor';

    let style = {
      pointerEvents: 'none',
      position: 'absolute',
      left: '0px',
      top: '0px',
      right: '0px',
      bottom: '0px',
      overflow: 'hidden',
      zIndex: '-1',
      visibility: 'hidden',
      maxWidth: '100%',
    };
    let styleChild = {
      position: 'absolute',
      left: '0px',
      top: '0px',
      transition: '0s',
    };

    setStyle(element.resizeSensor, style);

    let expand = document.createElement('div');
    expand.className = 'resize-sensor-expand';
    setStyle(expand, style);

    let expandChild = document.createElement('div');
    setStyle(expandChild, styleChild);
    expand.appendChild(expandChild);

    let shrink = document.createElement('div');
    shrink.className = 'resize-sensor-shrink';
    setStyle(shrink, style);

    let shrinkChild = document.createElement('div');
    setStyle(shrinkChild, styleChild);
    setStyle(shrinkChild, { width: '200%', height: '200%' });
    shrink.appendChild(shrinkChild);

    element.resizeSensor.appendChild(expand);
    element.resizeSensor.appendChild(shrink);
    element.appendChild(element.resizeSensor);

    let computedStyle = window.getComputedStyle(element);
    let position = computedStyle
      ? computedStyle.getPropertyValue('position')
      : null;
    if (
      'absolute' !== position &&
      'relative' !== position &&
      'fixed' !== position &&
      'sticky' !== position
    ) {
      element.style.position = 'relative';
    }

    let dirty = false;

    //last request animation frame id used in onscroll event
    let rafId = 0;
    let size = getElementSize(element);
    let lastWidth = 0;
    let lastHeight = 0;
    let initialHiddenCheck = true;
    lastAnimationFrameForInvisibleCheck = 0;

    let resetExpandShrink = function () {
      let width = element.offsetWidth;
      let height = element.offsetHeight;

      expandChild.style.width = width + 10 + 'px';
      expandChild.style.height = height + 10 + 'px';

      expand.scrollLeft = width + 10;
      expand.scrollTop = height + 10;

      shrink.scrollLeft = width + 10;
      shrink.scrollTop = height + 10;
    };

    let reset = function () {
      // Check if element is hidden
      if (initialHiddenCheck) {
        let invisible = element.offsetWidth === 0 && element.offsetHeight === 0;
        if (invisible) {
          // Check in next frame
          if (!lastAnimationFrameForInvisibleCheck) {
            lastAnimationFrameForInvisibleCheck = requestAnimationFrame(
              function () {
                lastAnimationFrameForInvisibleCheck = 0;
                reset();
              },
            );
          }

          return;
        } else {
          // Stop checking
          initialHiddenCheck = false;
        }
      }

      resetExpandShrink();
    };
    element.resizeSensor.resetSensor = reset;

    let onResized = function () {
      rafId = 0;

      if (!dirty) return;

      lastWidth = size.width;
      lastHeight = size.height;

      if (element.resizedAttached) {
        element.resizedAttached.call(size);
      }
    };

    let onScroll = function () {
      size = getElementSize(element);
      dirty = size.width !== lastWidth || size.height !== lastHeight;

      if (dirty && !rafId) {
        rafId = requestAnimationFrame(onResized);
      }

      reset();
    };

    let addEvent = function (el, name, cb) {
      if (el.attachEvent) {
        el.attachEvent('on' + name, cb);
      } else {
        el.addEventListener(name, cb);
      }
    };

    addEvent(expand, 'scroll', onScroll);
    addEvent(shrink, 'scroll', onScroll);

    // Fix for custom Elements and invisible elements
    lastAnimationFrameForInvisibleCheck = requestAnimationFrame(function () {
      lastAnimationFrameForInvisibleCheck = 0;
      reset();
    });
  }

  forEachElement(element, function (elem) {
    attachResizeEvent(elem, callback);
  });

  this.detach = function (ev) {
    // clean up the unfinished animation frame to prevent a potential endless requestAnimationFrame of reset
    if (lastAnimationFrameForInvisibleCheck) {
      cancelAnimationFrame(lastAnimationFrameForInvisibleCheck);
      lastAnimationFrameForInvisibleCheck = 0;
    }
    ResizeSensor.detach(element, ev);
  };

  this.reset = function () {
    //To prevent invoking element.resizeSensor.resetSensor if it's undefined
    if (element.resizeSensor.resetSensor) {
      element.resizeSensor.resetSensor();
    }
  };
};

ResizeSensor.reset = function (element) {
  forEachElement(element, function (elem) {
    //To prevent invoking element.resizeSensor.resetSensor if it's undefined
    if (element.resizeSensor.resetSensor) {
      elem.resizeSensor.resetSensor();
    }
  });
};

ResizeSensor.detach = function (element, ev) {
  forEachElement(element, function (elem) {
    if (!elem) return;
    if (elem.resizedAttached && typeof ev === 'function') {
      elem.resizedAttached.remove(ev);
      if (elem.resizedAttached.length()) return;
    }
    if (elem.resizeSensor) {
      if (elem.contains(elem.resizeSensor)) {
        elem.removeChild(elem.resizeSensor);
      }
      delete elem.resizeSensor;
      delete elem.resizedAttached;
    }
  });
};

if (typeof MutationObserver !== 'undefined') {
  let observer = new MutationObserver(function (mutations) {
    for (let i in mutations) {
      if (mutations.hasOwnProperty(i)) {
        let items = mutations[i].addedNodes;
        for (let j = 0; j < items.length; j++) {
          if (items[j].resizeSensor) {
            ResizeSensor.reset(items[j]);
          }
        }
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function (event) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
