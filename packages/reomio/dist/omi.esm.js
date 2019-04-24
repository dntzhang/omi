/**
 * omi v1.0.1  http://omijs.org
 * Omi === Preact + Scoped CSS + Store System + Native Support in 3kb javascript.
 * By dntzhang https://github.com/dntzhang
 * Github: https://github.com/Tencent/omi
 * MIT Licensed.
 */

/** Virtual DOM Node */
function VNode$1() {}

function getGlobal() {
  if (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {
    if (typeof self !== 'undefined') {
      return self;
    } else if (typeof window !== 'undefined') {
      return window;
    } else if (typeof global !== 'undefined') {
      return global;
    }
    return function () {
      return this;
    }();
  }
  return global;
}

/** Global options
 *	@public
 *	@namespace options {Object}
 */
var options = {
  scopedStyle: true,
  mapping: {},
  isWeb: true,
  staticStyleMapping: {},
  doc: typeof document === 'object' ? document : null,
  root: getGlobal(),
  //styleCache :[{ctor:ctor,ctorName:ctorName,style:style}]
  styleCache: []
  //componentChange(component, element) { },
  /** If `true`, `prop` changes trigger synchronous component updates.
   *	@name syncComponentUpdates
   *	@type Boolean
   *	@default true
   */
  //syncComponentUpdates: true,

  /** Processes all created VNodes.
   *	@param {VNode} vnode	A newly-created VNode to normalize/process
   */
  //vnode(vnode) { }

  /** Hook invoked after a component is mounted. */
  //afterMount(component) { },

  /** Hook invoked after the DOM is updated with a component's latest render. */
  //afterUpdate(component) { }

  /** Hook invoked immediately before a component is unmounted. */
  // beforeUnmount(component) { }
};

var stack = [];

/**
 * JSX/hyperscript reviver.
 * @see http://jasonformat.com/wtf-is-jsx
 * Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
 *
 * Note: this is exported as both `h()` and `createElement()` for compatibility reasons.
 *
 * Creates a VNode (virtual DOM element). A tree of VNodes can be used as a lightweight representation
 * of the structure of a DOM tree. This structure can be realized by recursively comparing it against
 * the current _actual_ DOM structure, and applying only the differences.
 *
 * `h()`/`createElement()` accepts an element name, a list of attributes/props,
 * and optionally children to append to the element.
 *
 * @example The following DOM tree
 *
 * `<div id="foo" name="bar">Hello!</div>`
 *
 * can be constructed using this function as:
 *
 * `h('div', { id: 'foo', name : 'bar' }, 'Hello!');`
 *
 * @param {string} nodeName	An element name. Ex: `div`, `a`, `span`, etc.
 * @param {Object} attributes	Any attributes/props to set on the created element.
 * @param rest			Additional arguments are taken to be children to append. Can be infinitely nested Arrays.
 *
 * @public
 */
function h(nodeName, attributes) {
  var children = [],
      lastSimple,
      child,
      simple,
      i;
  for (i = arguments.length; i-- > 2;) {
    stack.push(arguments[i]);
  }
  if (attributes && attributes.children != null) {
    if (!stack.length) stack.push(attributes.children);
    delete attributes.children;
  }
  while (stack.length) {
    if ((child = stack.pop()) && child.pop !== undefined) {
      for (i = child.length; i--;) {
        stack.push(child[i]);
      }
    } else {
      if (typeof child === 'boolean') child = null;

      if (simple = typeof nodeName !== 'function') {
        if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
      }

      if (simple && lastSimple) {
        children[children.length - 1] += child;
      } else if (children.length === 0) {
        children = [child];
      } else {
        children.push(child);
      }

      lastSimple = simple;
    }
  }

  var p = new VNode$1();
  p.nodeName = nodeName;
  p.children = children;
  p.attributes = attributes == null ? undefined : attributes;
  p.key = attributes == null ? undefined : attributes.key;

  // if a "vnode hook" is defined, pass every created VNode to it
  if (options.vnode !== undefined) options.vnode(p);

  return p;
}

if (typeof Element !== 'undefined' && !Element.prototype.addEventListener) {
  var runListeners = function runListeners(oEvent) {
    if (!oEvent) {
      oEvent = window.event;
    }
    for (var iLstId = 0, iElId = 0, oEvtListeners = oListeners[oEvent.type]; iElId < oEvtListeners.aEls.length; iElId++) {
      if (oEvtListeners.aEls[iElId] === this) {
        for (iLstId; iLstId < oEvtListeners.aEvts[iElId].length; iLstId++) {
          oEvtListeners.aEvts[iElId][iLstId].call(this, oEvent);
        }
        break;
      }
    }
  };

  var oListeners = {};

  Element.prototype.addEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */
  ) {
    if (oListeners.hasOwnProperty(sEventType)) {
      var oEvtListeners = oListeners[sEventType];
      for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) {
          nElIdx = iElId;
          break;
        }
      }
      if (nElIdx === -1) {
        oEvtListeners.aEls.push(this);
        oEvtListeners.aEvts.push([fListener]);
        this['on' + sEventType] = runListeners;
      } else {
        var aElListeners = oEvtListeners.aEvts[nElIdx];
        if (this['on' + sEventType] !== runListeners) {
          aElListeners.splice(0);
          this['on' + sEventType] = runListeners;
        }
        for (var iLstId = 0; iLstId < aElListeners.length; iLstId++) {
          if (aElListeners[iLstId] === fListener) {
            return;
          }
        }
        aElListeners.push(fListener);
      }
    } else {
      oListeners[sEventType] = { aEls: [this], aEvts: [[fListener]] };
      this['on' + sEventType] = runListeners;
    }
  };
  Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */
  ) {
    if (!oListeners.hasOwnProperty(sEventType)) {
      return;
    }
    var oEvtListeners = oListeners[sEventType];
    for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
      if (oEvtListeners.aEls[iElId] === this) {
        nElIdx = iElId;
        break;
      }
    }
    if (nElIdx === -1) {
      return;
    }
    for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
      if (aElListeners[iLstId] === fListener) {
        aElListeners.splice(iLstId, 1);
      }
    }
  };
}

if (typeof Object.create !== 'function') {
  Object.create = function (proto, propertiesObject) {
    if (typeof proto !== 'object' && typeof proto !== 'function') {
      throw new TypeError('Object prototype may only be an Object: ' + proto);
    } else if (proto === null) {
      throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");
    }

    // if (typeof propertiesObject != 'undefined') {
    //     throw new Error("This browser's implementation of Object.create is a shim and doesn't support a second argument.");
    // }

    function F() {}
    F.prototype = proto;

    return new F();
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

/**
 *  Copy all properties from `props` onto `obj`.
 *  @param {Object} obj		Object onto which properties should be copied.
 *  @param {Object} props	Object from which to copy properties.
 *  @returns obj
 *  @private
 */
function extend(obj, props) {
  for (var i in props) {
    obj[i] = props[i];
  }return obj;
}

/** Invoke or update a ref, depending on whether it is a function or object ref.
 *  @param {object|function} [ref=null]
 *  @param {any} [value]
 */
function applyRef(ref, value) {
  if (ref != null) {
    if (typeof ref == 'function') ref(value);else ref.current = value;
  }
}

/**
 * Call a function asynchronously, as soon as possible. Makes
 * use of HTML Promise to schedule the callback if available,
 * otherwise falling back to `setTimeout` (mainly for IE<11).
 *
 * @param {Function} callback
 */

var usePromise = typeof Promise == 'function';

// for native
if (typeof document !== 'object' && typeof global !== 'undefined' && global.__config__) {
  if (global.__config__.platform === 'android') {
    usePromise = true;
  } else {
    var systemVersion = global.__config__.systemVersion && global.__config__.systemVersion.split('.')[0] || 0;
    if (systemVersion > 8) {
      usePromise = true;
    }
  }
}

var defer = usePromise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

function getUse(data, paths) {
  var obj = [];
  paths.forEach(function (path, index) {
    var isPath = typeof path === 'string';
    if (isPath) {
      obj[index] = getTargetByPath(data, path);
    } else {
      var key = Object.keys(path)[0];
      var value = path[key];
      if (typeof value === 'string') {
        obj[index] = getTargetByPath(data, value);
      } else {
        var tempPath = value[0];
        if (typeof tempPath === 'string') {
          var tempVal = getTargetByPath(data, tempPath);
          obj[index] = value[1] ? value[1](tempVal) : tempVal;
        } else {
          var args = [];
          tempPath.forEach(function (path) {
            args.push(getTargetByPath(data, path));
          });
          obj[index] = value[1].apply(null, args);
        }
      }
      obj[key] = obj[index];
    }
  });
  return obj;
}

function getTargetByPath(origin, path) {
  var arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.');
  var current = origin;
  for (var i = 0, len = arr.length; i < len; i++) {
    current = current[arr[i]];
  }
  return current;
}

/**
 * Clones the given VNode, optionally adding attributes/props and replacing its
 * children.
 * @param {import('./vnode').VNode} vnode The virtual DOM element to clone
 * @param {object} props Attributes/props to add when cloning
 * @param {Array<import('./vnode').VNode>} [rest] Any additional arguments will be used as replacement
 *  children.
 */
function cloneElement(vnode, props) {
  return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
}

// DOM properties that should NOT have "px" added when numeric
var IS_NON_DIMENSIONAL$1 = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

/**
 * Managed queue of dirty components to be re-rendered
 * @type {Array<import('./component').Component>}
 */
var items = [];

/**
 * Enqueue a rerender of a component
 * @param {import('./component').Component} component The component to rerender
 */
function enqueueRender(component) {
  if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
(options.debounceRendering || defer)(rerender);
  }
}

/** Rerender all enqueued dirty components */
function rerender() {
  var p;
  while (p = items.pop()) {
    if (p._dirty) renderComponent(p);
  }
}

var mapping = options.mapping;
/**
 * Check if two nodes are equivalent.
 *
 * @param {Node} node			DOM Node to compare
 * @param {VNode} vnode			Virtual DOM node to compare
 * @param {boolean} [hydrating=false]	If true, ignores component constructors when comparing.
 * @private
 */
function isSameNodeType(node, vnode, hydrating) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return node.splitText !== undefined;
  }
  if (typeof vnode.nodeName === 'string') {
    var ctor = mapping[vnode.nodeName];
    if (ctor) {
      return hydrating || node._componentConstructor === ctor;
    }
    return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
  }
  return hydrating || node._componentConstructor === vnode.nodeName;
}

/**
 * Check if an Element has a given nodeName, case-insensitively.
 *
 * @param {Element} node	A DOM Element to inspect the name of.
 * @param {String} nodeName	Unnormalized name to compare against.
 */
function isNamedNode(node, nodeName) {
  return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

/**
 * Reconstruct Component-style `props` from a VNode.
 * Ensures default/fallback values from `defaultProps`:
 * Own-properties of `defaultProps` not present in `vnode.attributes` are added.
 *
 * @param {VNode} vnode
 * @returns {Object} props
 */
function getNodeProps(vnode) {
  var props = extend({}, vnode.attributes);
  props.children = vnode.children;

  var defaultProps = vnode.nodeName.defaultProps;
  if (defaultProps !== undefined) {
    for (var i in defaultProps) {
      if (props[i] === undefined) {
        props[i] = defaultProps[i];
      }
    }
  }

  return props;
}

/** Create an element with the given nodeName.
 *	@param {String} nodeName
 *	@param {Boolean} [isSvg=false]	If `true`, creates an element within the SVG namespace.
 *	@returns {Element} node
 */
function createNode(nodeName, isSvg) {
  var node = isSvg ? options.doc.createElementNS('http://www.w3.org/2000/svg', nodeName) : options.doc.createElement(nodeName);
  node.normalizedNodeName = nodeName;
  return node;
}

function parseCSSText(cssText) {
  var cssTxt = cssText.replace(/\/\*(.|\s)*?\*\//g, ' ').replace(/\s+/g, ' ');
  var style = {},
      _ref = cssTxt.match(/ ?(.*?) ?{([^}]*)}/) || [a, b, cssTxt],
      a = _ref[0],
      b = _ref[1],
      rule = _ref[2];

  var cssToJs = function cssToJs(s) {
    return s.replace(/\W+\w/g, function (match) {
      return match.slice(-1).toUpperCase();
    });
  };
  var properties = rule.split(';').map(function (o) {
    return o.split(':').map(function (x) {
      return x && x.trim();
    });
  });
  for (var i = properties, i = Array.isArray(i), i = 0, i = i ? i : i[Symbol.iterator]();;) {
    var _ref3;

    if (i) {
      if (i >= i.length) break;
      _ref3 = i[i++];
    } else {
      i = i.next();
      if (i.done) break;
      _ref3 = i.value;
    }

    var _ref2 = _ref3;
    var property = _ref2[0];
    var value = _ref2[1];
    style[cssToJs(property)] = value;
  }return style;
}

/** Remove a child node from its parent if attached.
 *	@param {Element} node		The node to remove
 */
function removeNode(node) {
  var parentNode = node.parentNode;
  if (parentNode) parentNode.removeChild(node);
}

/** Set a named attribute on the given Node, with special behavior for some names and event handlers.
 *	If `value` is `null`, the attribute/handler will be removed.
 *	@param {Element} node	An element to mutate
 *	@param {string} name	The name/key to set, such as an event or attribute name
 *	@param {any} old	The last value that was set for this name/node pair
 *	@param {any} value	An attribute value, such as a function to be used as an event handler
 *	@param {Boolean} isSvg	Are we currently diffing inside an svg?
 *	@private
 */
function setAccessor(node, name, old, value, isSvg) {
  if (name === 'className') name = 'class';

  if (name === 'key') {
    // ignore
  } else if (name === 'ref') {
    applyRef(old, null);
    applyRef(value, node);
  } else if (name === 'class' && !isSvg) {
    node.className = value || '';
  } else if (name === 'style') {
    if (options.isWeb) {
      if (!value || typeof value === 'string' || typeof old === 'string') {
        node.style.cssText = value || '';
      }
      if (value && typeof value === 'object') {
        if (typeof old !== 'string') {
          for (var i in old) {
            if (!(i in value)) node.style[i] = '';
          }
        }
        for (var i in value) {
          node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL$1.test(i) === false ? value[i] + 'px' : value[i];
        }
      }
    } else {
      var oldJson = old,
          currentJson = value;
      if (typeof old === 'string') {
        oldJson = parseCSSText(old);
      }
      if (typeof value == 'string') {
        currentJson = parseCSSText(value);
      }

      var result = {},
          changed = false;

      if (oldJson) {
        for (var key in oldJson) {
          if (typeof currentJson == 'object' && !(key in currentJson)) {
            result[key] = '';
            changed = true;
          }
        }

        for (var ckey in currentJson) {
          if (currentJson[ckey] !== oldJson[ckey]) {
            result[ckey] = currentJson[ckey];
            changed = true;
          }
        }

        if (changed) {
          node.setStyles(result);
        }
      } else {
        node.setStyles(currentJson);
      }
    }
  } else if (name === 'dangerouslySetInnerHTML') {
    if (value) node.innerHTML = value.__html || '';
  } else if (name[0] == 'o' && name[1] == 'n') {
    var useCapture = name !== (name = name.replace(/Capture$/, ''));
    name = name.toLowerCase().substring(2);
    if (value) {
      if (!old) {
        node.addEventListener(name, eventProxy, useCapture);
        if (name == 'tap') {
          node.addEventListener('touchstart', touchStart, useCapture);
          node.addEventListener('touchend', touchEnd, useCapture);
        }
      }
    } else {
      node.removeEventListener(name, eventProxy, useCapture);
      if (name == 'tap') {
        node.removeEventListener('touchstart', touchStart, useCapture);
        node.removeEventListener('touchend', touchEnd, useCapture);
      }
    }
(node._listeners || (node._listeners = {}))[name] = value;
  } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
    // Attempt to set a DOM property to the given value.
    // IE & FF throw for certain property-value combinations.
    try {
      node[name] = value == null ? '' : value;
    } catch (e) {}
    if ((value == null || value === false) && name != 'spellcheck') node.removeAttribute(name);
  } else {
    var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
    if (value == null || value === false) {
      if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
    } else if (typeof value !== 'function') {
      if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
    }
  }
}

/** Proxy an event to hooked event handlers
 *	@private
 */
function eventProxy(e) {
  return this._listeners[e.type](options.event && options.event(e) || e);
}

function touchStart(e) {
  this.___touchX = e.touches[0].pageX;
  this.___touchY = e.touches[0].pageY;
  this.___scrollTop = document.body.scrollTop;
}

function touchEnd(e) {
  if (Math.abs(e.changedTouches[0].pageX - this.___touchX) < 30 && Math.abs(e.changedTouches[0].pageY - this.___touchY) < 30 && Math.abs(document.body.scrollTop - this.___scrollTop) < 30) {
    this.dispatchEvent(new CustomEvent('tap', { detail: e }));
  }
}

var styleId = 0;

function getCtorName(ctor) {
  for (var i = 0, len = options.styleCache.length; i < len; i++) {
    var item = options.styleCache[i];

    if (item.ctor === ctor) {
      return item.attrName;
    }
  }

  var attrName = 's' + styleId;
  options.styleCache.push({ ctor: ctor, attrName: attrName });
  styleId++;

  return attrName;
}

// many thanks to https://github.com/thomaspark/scoper/
function scoper(css, prefix) {
  prefix = '[' + prefix.toLowerCase() + ']';
  // https://www.w3.org/TR/css-syntax-3/#lexical
  css = css.replace(/\/\*[^*]*\*+([^/][^*]*\*+)*\//g, '');
  // eslint-disable-next-line
  var re = new RegExp('([^\r\n,{}:]+)(:[^\r\n,{}]+)?(,(?=[^{}]*{)|\s*{)', 'g');
  /**
   * Example:
   *
   * .classname::pesudo { color:red }
   *
   * g1 is normal selector `.classname`
   * g2 is pesudo class or pesudo element
   * g3 is the suffix
   */
  css = css.replace(re, function (g0, g1, g2, g3) {
    if (typeof g2 === 'undefined') {
      g2 = '';
    }

    /* eslint-ignore-next-line */
    if (g1.match(/^\s*(@media|\d+%?|@-webkit-keyframes|@keyframes|to|from|@font-face)/)) {
      return g1 + g2 + g3;
    }

    var appendClass = g1.replace(/(\s*)$/, '') + prefix + g2;
    //let prependClass = prefix + ' ' + g1.trim() + g2;

    return appendClass + g3;
    //return appendClass + ',' + prependClass + g3;
  });

  return css;
}

function addStyle(cssText, id) {
  id = id.toLowerCase();
  var ele = document.getElementById(id);
  var head = document.getElementsByTagName('head')[0];
  if (ele && ele.parentNode === head) {
    head.removeChild(ele);
  }

  var someThingStyles = document.createElement('style');
  head.appendChild(someThingStyles);
  someThingStyles.setAttribute('type', 'text/css');
  someThingStyles.setAttribute('id', id);
  if (window.ActiveXObject) {
    someThingStyles.styleSheet.cssText = cssText;
  } else {
    someThingStyles.textContent = cssText;
  }
}

function addStyleWithoutId(cssText) {
  var head = document.getElementsByTagName('head')[0];
  var someThingStyles = document.createElement('style');
  head.appendChild(someThingStyles);
  someThingStyles.setAttribute('type', 'text/css');

  if (window.ActiveXObject) {
    someThingStyles.styleSheet.cssText = cssText;
  } else {
    someThingStyles.textContent = cssText;
  }
}

function addScopedAttrStatic(vdom, attr) {
  if (options.scopedStyle) {
    scopeVdom(attr, vdom);
  }
}

function addStyleToHead(style, attr) {
  if (options.scopedStyle) {
    if (!options.staticStyleMapping[attr]) {
      addStyle(scoper(style, attr), attr);
      options.staticStyleMapping[attr] = true;
    }
  } else if (!options.staticStyleMapping[attr]) {
    addStyleWithoutId(style);
    options.staticStyleMapping[attr] = true;
  }
}

function scopeVdom(attr, vdom) {
  if (typeof vdom === 'object') {
    vdom.attributes = vdom.attributes || {};
    vdom.attributes[attr] = '';
    vdom.css = vdom.css || {};
    vdom.css[attr] = '';
    vdom.children.forEach(function (child) {
      return scopeVdom(attr, child);
    });
  }
}

function scopeHost(vdom, css) {
  if (typeof vdom === 'object' && css) {
    vdom.attributes = vdom.attributes || {};
    for (var key in css) {
      vdom.attributes[key] = '';
    }
  }
}

/** Queue of components that have been mounted and are awaiting componentDidMount */
var mounts = [];

/** Diff recursion count, used to track the end of the diff cycle. */
var diffLevel = 0;

/** Global flag indicating if the diff is currently within an SVG */
var isSvgMode = false;

/** Global flag indicating if the diff is performing hydration */
var hydrating = false;

/** Invoke queued componentDidMount lifecycle methods */
function flushMounts() {
  var c;
  while (c = mounts.shift()) {
    if (options.afterMount) options.afterMount(c);
    if (c.componentDidMount) c.componentDidMount();
    if (c.installed) c.installed();
    if (c.constructor.css || c.css) {
      addStyleToHead(c.constructor.css ? c.constructor.css : typeof c.css === 'function' ? c.css() : c.css, '_s' + getCtorName(c.constructor));
    }
  }
}

/** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
 *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
 *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
 *	@returns {Element} dom			The created/mutated element
 *	@private
 */
function diff(dom, vnode, context, mountAll, parent, componentRoot) {
  // diffLevel having been 0 here indicates initial entry into the diff (not a subdiff)
  if (!diffLevel++) {
    // when first starting the diff, check if we're diffing an SVG or within an SVG
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

    // hydration is indicated by the existing element to be diffed not having a prop cache
    hydrating = dom != null && !('__omiattr_' in dom);
  }
  var ret;

  if (isArray(vnode)) {
    vnode = {
      nodeName: 'span',
      children: vnode
    };
  }

  ret = idiff(dom, vnode, context, mountAll, componentRoot);
  // append the element if its a new parent
  if (parent && ret.parentNode !== parent) parent.appendChild(ret);

  // diffLevel being reduced to 0 means we're exiting the diff
  if (! --diffLevel) {
    hydrating = false;
    // invoke queued componentDidMount lifecycle methods
    if (!componentRoot) flushMounts();
  }

  return ret;
}

/** Internals of `diff()`, separated to allow bypassing diffLevel / mount flushing. */
function idiff(dom, vnode, context, mountAll, componentRoot) {
  var out = dom,
      prevSvgMode = isSvgMode;

  // empty values (null, undefined, booleans) render as empty Text nodes
  if (vnode == null || typeof vnode === 'boolean') vnode = '';

  // If the VNode represents a Component, perform a component diff:
  var vnodeName = vnode.nodeName;
  if (options.mapping[vnodeName]) {
    vnode.nodeName = options.mapping[vnodeName];
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }

  // Fast case: Strings & Numbers create/update Text nodes.
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    // update if it's already a Text node:
    if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
      /* istanbul ignore if */ /* Browser quirk that can't be covered: https://github.com/developit/preact/commit/fd4f21f5c45dfd75151bd27b4c217d8003aa5eb9 */
      if (dom.nodeValue != vnode) {
        dom.nodeValue = vnode;
      }
    } else {
      // it wasn't a Text node: replace it with one and recycle the old Element
      out = document.createTextNode(vnode);
      if (dom) {
        if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
        recollectNodeTree(dom, true);
      }
    }

    //ie8 error
    try {
      out['__omiattr_'] = true;
    } catch (e) {}

    return out;
  }

  if (typeof vnodeName === 'function') {
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }

  // Tracks entering and exiting SVG namespace when descending through the tree.
  isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

  // If there's no existing element or it's the wrong type, create a new one:
  vnodeName = String(vnodeName);
  if (!dom || !isNamedNode(dom, vnodeName)) {
    out = createNode(vnodeName, isSvgMode);

    if (dom) {
      // move children into the replacement node
      while (dom.firstChild) {
        out.appendChild(dom.firstChild);
      } // if the previous Element was mounted into the DOM, replace it inline
      if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

      // recycle the old element (skips non-Element node types)
      recollectNodeTree(dom, true);
    }
  }

  var fc = out.firstChild,
      props = out['__omiattr_'],
      vchildren = vnode.children;

  if (props == null) {
    props = out['__omiattr_'] = {};
    for (var a = out.attributes, i = a.length; i--;) {
      props[a[i].name] = a[i].value;
    }
  }

  // Optimization: fast-path for elements containing a single TextNode:
  if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
    if (fc.nodeValue != vchildren[0]) {
      fc.nodeValue = vchildren[0];
    }
  }
  // otherwise, if there are existing or new children, diff them:
  else if (vchildren && vchildren.length || fc != null) {
      innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
    }

  // Apply attributes/props from VNode to the DOM Element:
  diffAttributes(out, vnode.attributes, props);

  // restore previous SVG mode: (in case we're exiting an SVG namespace)
  isSvgMode = prevSvgMode;

  return out;
}

/** Apply child and attribute changes between a VNode and a DOM Node to the DOM.
 *	@param {Element} dom			Element whose children should be compared & mutated
 *	@param {Array} vchildren		Array of VNodes to compare to `dom.childNodes`
 *	@param {Object} context			Implicitly descendant context object (from most recent `getChildContext()`)
 *	@param {Boolean} mountAll
 *	@param {Boolean} isHydrating	If `true`, consumes externally created elements similar to hydration
 */
function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
  var originalChildren = dom.childNodes,
      children = [],
      keyed = {},
      keyedLen = 0,
      min = 0,
      len = originalChildren.length,
      childrenLen = 0,
      vlen = vchildren ? vchildren.length : 0,
      j,
      c,
      f,
      vchild,
      child;

  // Build up a map of keyed children and an Array of unkeyed children:
  if (len !== 0) {
    for (var i = 0; i < len; i++) {
      var _child = originalChildren[i],
          props = _child['__omiattr_'],
          key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
      if (key != null) {
        keyedLen++;
        keyed[key] = _child;
      } else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
        children[childrenLen++] = _child;
      }
    }
  }

  if (vlen !== 0) {
    for (var i = 0; i < vlen; i++) {
      vchild = vchildren[i];
      child = null;

      // attempt to find a node based on key matching
      var key = vchild.key;
      if (key != null) {
        if (keyedLen && keyed[key] !== undefined) {
          child = keyed[key];
          keyed[key] = undefined;
          keyedLen--;
        }
      }
      // attempt to pluck a node of the same type from the existing children
      else if (min < childrenLen) {
          for (j = min; j < childrenLen; j++) {
            if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
              child = c;
              children[j] = undefined;
              if (j === childrenLen - 1) childrenLen--;
              if (j === min) min++;
              break;
            }
          }
        }

      // morph the matched/found/created DOM child to match vchild (deep)
      child = idiff(child, vchild, context, mountAll);

      f = originalChildren[i];
      if (child && child !== dom && child !== f) {
        if (f == null) {
          dom.appendChild(child);
        } else if (child === f.nextSibling) {
          removeNode(f);
        } else {
          dom.insertBefore(child, f);
        }
      }
    }
  }

  // remove unused keyed children:
  if (keyedLen) {
    for (var i in keyed) {
      if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
    }
  }

  // remove orphaned unkeyed children:
  while (min <= childrenLen) {
    if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
  }
}

/** Recursively recycle (or just unmount) a node and its descendants.
 *	@param {Node} node						DOM node to start unmount/removal from
 *	@param {Boolean} [unmountOnly=false]	If `true`, only triggers unmount lifecycle, skips removal
 */
function recollectNodeTree(node, unmountOnly) {
  var component = node._component;
  if (component) {
    // if node is owned by a Component, unmount that component (ends up recursing back here)
    unmountComponent(component);
  } else {
    // If the node's VNode had a ref function, invoke it with null here.
    // (this is part of the React spec, and smart for unsetting references)
    if (node['__omiattr_'] != null) applyRef(node['__omiattr_'].ref, null);

    if (unmountOnly === false || node['__omiattr_'] == null) {
      removeNode(node);
    }

    removeChildren(node);
  }
}

/** Recollect/unmount all children.
 *	- we use .lastChild here because it causes less reflow than .firstChild
 *	- it's also cheaper than accessing the .childNodes Live NodeList
 */
function removeChildren(node) {
  node = node.lastChild;
  while (node) {
    var next = node.previousSibling;
    recollectNodeTree(node, true);
    node = next;
  }
}

/** Apply differences in attributes from a VNode to the given DOM Element.
 *	@param {Element} dom		Element with attributes to diff `attrs` against
 *	@param {Object} attrs		The desired end-state key-value attribute pairs
 *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
 */
function diffAttributes(dom, attrs, old) {
  var name;

  // remove attributes no longer present on the vnode by setting them to undefined
  for (name in old) {
    if (!(attrs && attrs[name] != null) && old[name] != null) {
      setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
    }
  }

  // add new & update changed attributes
  for (name in attrs) {
    if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
      setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
  }
}

function define(name, ctor) {
  options.mapping[name] = ctor;
  if (ctor.use) {
    ctor.updatePath = getPath(ctor.use);
  } else if (ctor.data) {
    //Compatible with older versions
    ctor.updatePath = getUpdatePath(ctor.data);
  }
}

function getPath(obj) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    var result = {};
    obj.forEach(function (item) {
      if (typeof item === 'string') {
        result[item] = true;
      } else {
        var tempPath = item[Object.keys(item)[0]];
        if (typeof tempPath === 'string') {
          result[tempPath] = true;
        } else {
          if (typeof tempPath[0] === 'string') {
            result[tempPath[0]] = true;
          } else {
            tempPath[0].forEach(function (path) {
              return result[path] = true;
            });
          }
        }
      }
    });
    return result;
  } else {
    return getUpdatePath(obj);
  }
}

function getUpdatePath(data) {
  var result = {};
  dataToPath(data, result);
  return result;
}

function dataToPath(data, result) {
  Object.keys(data).forEach(function (key) {
    result[key] = true;
    var type = Object.prototype.toString.call(data[key]);
    if (type === '[object Object]') {
      _objToPath(data[key], key, result);
    } else if (type === '[object Array]') {
      _arrayToPath(data[key], key, result);
    }
  });
}

function _objToPath(data, path, result) {
  Object.keys(data).forEach(function (key) {
    result[path + '.' + key] = true;
    delete result[path];
    var type = Object.prototype.toString.call(data[key]);
    if (type === '[object Object]') {
      _objToPath(data[key], path + '.' + key, result);
    } else if (type === '[object Array]') {
      _arrayToPath(data[key], path + '.' + key, result);
    }
  });
}

function _arrayToPath(data, path, result) {
  data.forEach(function (item, index) {
    result[path + '[' + index + ']'] = true;
    delete result[path];
    var type = Object.prototype.toString.call(item);
    if (type === '[object Object]') {
      _objToPath(item, path + '[' + index + ']', result);
    } else if (type === '[object Array]') {
      _arrayToPath(item, path + '[' + index + ']', result);
    }
  });
}

/**
 * Retains a pool of Components for re-use.
 * @type {Component[]}
 * @private
 */
var recyclerComponents = [];

/**
 * Create a component. Normalizes differences between PFC's and classful
 * Components.
 * @param {function} Ctor The constructor of the component to create
 * @param {object} props The initial props of the component
 * @param {object} context The initial context of the component
 * @returns {import('../component').Component}
 */
function createComponent(Ctor, props, context, vnode) {
  var inst,
      i = recyclerComponents.length;

  if (Ctor.prototype && Ctor.prototype.render) {
    inst = new Ctor(props, context);
    Component.call(inst, props, context);
  } else {
    inst = new Component(props, context);
    inst.constructor = Ctor;
    inst.render = doRender;
  }
  vnode && (inst.scopedCssAttr = vnode.css);

  if (inst.store && inst.store.data) {
    if (inst.constructor.use) {
      inst.use = getUse(inst.store.data, inst.constructor.use);
      inst.store.instances.push(inst);
    } else if (inst.initUse) {
      var use = inst.initUse();
      inst._updatePath = getPath(use);
      inst.use = getUse(inst.store.data, use);
      inst.store.instances.push(inst);
    }
  }

  while (i--) {
    if (recyclerComponents[i].constructor === Ctor) {
      inst.nextBase = recyclerComponents[i].nextBase;
      recyclerComponents.splice(i, 1);
      return inst;
    }
  }

  return inst;
}

/** The `.render()` method for a PFC backing instance. */
function doRender(props, data, context) {
  return this.constructor(props, context);
}

/* obaa 1.0.0
 * By dntzhang
 * Github: https://github.com/Tencent/omi
 * MIT Licensed.
 */

var obaa = function obaa(target, arr, callback) {
  var _observe = function _observe(target, arr, callback) {
    if (!target.$observer) target.$observer = this;
    var $observer = target.$observer;
    var eventPropArr = [];
    if (obaa.isArray(target)) {
      if (target.length === 0) {
        target.$observeProps = {};
        target.$observeProps.$observerPath = '#';
      }
      $observer.mock(target);
    }
    for (var prop in target) {
      if (target.hasOwnProperty(prop)) {
        if (callback) {
          if (obaa.isArray(arr) && obaa.isInArray(arr, prop)) {
            eventPropArr.push(prop);
            $observer.watch(target, prop);
          } else if (obaa.isString(arr) && prop == arr) {
            eventPropArr.push(prop);
            $observer.watch(target, prop);
          }
        } else {
          eventPropArr.push(prop);
          $observer.watch(target, prop);
        }
      }
    }
    $observer.target = target;
    if (!$observer.propertyChangedHandler) $observer.propertyChangedHandler = [];
    var propChanged = callback ? callback : arr;
    $observer.propertyChangedHandler.push({
      all: !callback,
      propChanged: propChanged,
      eventPropArr: eventPropArr
    });
  };
  _observe.prototype = {
    onPropertyChanged: function onPropertyChanged(prop, value, oldValue, target, path) {
      if (value !== oldValue && this.propertyChangedHandler) {
        var rootName = obaa._getRootName(prop, path);
        for (var i = 0, len = this.propertyChangedHandler.length; i < len; i++) {
          var handler = this.propertyChangedHandler[i];
          if (handler.all || obaa.isInArray(handler.eventPropArr, rootName) || rootName.indexOf('Array-') === 0) {
            handler.propChanged.call(this.target, prop, value, oldValue, path);
          }
        }
      }
      if (prop.indexOf('Array-') !== 0 && typeof value === 'object') {
        this.watch(target, prop, target.$observeProps.$observerPath);
      }
    },
    mock: function mock(target) {
      var self = this;
      obaa.methods.forEach(function (item) {
        target[item] = function () {
          var old = Array.prototype.slice.call(this, 0);
          var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
          if (new RegExp('\\b' + item + '\\b').test(obaa.triggerStr)) {
            for (var cprop in this) {
              if (this.hasOwnProperty(cprop) && !obaa.isFunction(this[cprop])) {
                self.watch(this, cprop, this.$observeProps.$observerPath);
              }
            }
            //todo
            self.onPropertyChanged('Array-' + item, this, old, this, this.$observeProps.$observerPath);
          }
          return result;
        };
        target['pure' + item.substring(0, 1).toUpperCase() + item.substring(1)] = function () {
          return Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
        };
      });
    },
    watch: function watch(target, prop, path) {
      if (prop === '$observeProps' || prop === '$observer') return;
      if (obaa.isFunction(target[prop])) return;
      if (!target.$observeProps) target.$observeProps = {};
      if (path !== undefined) {
        target.$observeProps.$observerPath = path;
      } else {
        target.$observeProps.$observerPath = '#';
      }
      var self = this;
      var currentValue = target.$observeProps[prop] = target[prop];
      Object.defineProperty(target, prop, {
        get: function get() {
          return this.$observeProps[prop];
        },
        set: function set(value) {
          var old = this.$observeProps[prop];
          this.$observeProps[prop] = value;
          self.onPropertyChanged(prop, value, old, this, target.$observeProps.$observerPath);
        }
      });
      if (typeof currentValue == 'object') {
        if (obaa.isArray(currentValue)) {
          this.mock(currentValue);
          if (currentValue.length === 0) {
            if (!currentValue.$observeProps) currentValue.$observeProps = {};
            if (path !== undefined) {
              currentValue.$observeProps.$observerPath = path;
            } else {
              currentValue.$observeProps.$observerPath = '#';
            }
          }
        }
        for (var cprop in currentValue) {
          if (currentValue.hasOwnProperty(cprop)) {
            this.watch(currentValue, cprop, target.$observeProps.$observerPath + '-' + prop);
          }
        }
      }
    }
  };
  return new _observe(target, arr, callback);
};

obaa.methods = ['concat', 'copyWithin', 'entries', 'every', 'fill', 'filter', 'find', 'findIndex', 'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort', 'splice', 'toLocaleString', 'toString', 'unshift', 'values', 'size'];
obaa.triggerStr = ['concat', 'copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'size'].join(',');

obaa.isArray = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

obaa.isString = function (obj) {
  return typeof obj === 'string';
};

obaa.isInArray = function (arr, item) {
  for (var i = arr.length; --i > -1;) {
    if (item === arr[i]) return true;
  }
  return false;
};

obaa.isFunction = function (obj) {
  return Object.prototype.toString.call(obj) == '[object Function]';
};

obaa._getRootName = function (prop, path) {
  if (path === '#') {
    return prop;
  }
  return path.split('-')[1];
};

obaa.add = function (obj, prop) {
  var $observer = obj.$observer;
  $observer.watch(obj, prop);
};

obaa.set = function (obj, prop, value, exec) {
  if (!exec) {
    obj[prop] = value;
  }
  var $observer = obj.$observer;
  $observer.watch(obj, prop);
  if (exec) {
    obj[prop] = value;
  }
};

Array.prototype.size = function (length) {
  this.length = length;
};

var callbacks = [];
var nextTickCallback = [];

function fireTick() {
  callbacks.forEach(function (item) {
    item.fn.call(item.scope);
  });

  nextTickCallback.forEach(function (nextItem) {
    nextItem.fn.call(nextItem.scope);
  });
  nextTickCallback.length = 0;
}

function proxyUpdate(ele) {
  var timeout = null;
  obaa(ele.data, function () {
    if (ele._willUpdate) {
      return;
    }
    if (ele.constructor.mergeUpdate) {
      clearTimeout(timeout);

      timeout = setTimeout(function () {
        ele.update();
        fireTick();
      }, 0);
    } else {
      ele.update();
      fireTick();
    }
  });
}

/** Set a component's `props` (generally derived from JSX attributes).
 *	@param {Object} props
 *	@param {Object} [opts]
 *	@param {boolean} [opts.renderSync=false]	If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
 *	@param {boolean} [opts.render=true]			If `false`, no render will be triggered.
 */
function setComponentProps(component, props, renderMode, context, mountAll) {
  if (component._disable) return;
  component._disable = true;

  component.__ref = props.ref;
  component.__key = props.key;
  delete props.ref;
  delete props.key;

  if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
    if (!component.base || mountAll) {
      if (component.componentWillMount) component.componentWillMount();
    } else if (component.componentWillReceiveProps) {
      component.componentWillReceiveProps(props, context);
    }
  }

  if (!component.base || mountAll) {
    if (component.beforeInstall) component.beforeInstall();
    if (component.install) component.install();
    if (component.constructor.observe) {
      proxyUpdate(component);
    }
  } else if (component.receiveProps) {
    component.receiveProps(props, context, component.props);
  }

  if (context && context !== component.context) {
    if (!component.prevContext) component.prevContext = component.context;
    component.context = context;
  }

  if (!component.prevProps) component.prevProps = component.props;
  component.props = props;

  component._disable = false;

  if (renderMode !== 0) {
    if (renderMode === 1 || options.syncComponentUpdates !== false || !component.base) {
      renderComponent(component, 1, mountAll);
    } else {
      enqueueRender(component);
    }
  }

  applyRef(component.__ref, component);
}

/** Render a Component, triggering necessary lifecycle events and taking High-Order Components into account.
 *	@param {Component} component
 *	@param {Object} [opts]
 *	@param {boolean} [opts.build=false]		If `true`, component will build and store a DOM node if not already associated with one.
 *	@private
 */
function renderComponent(component, renderMode, mountAll, isChild) {
  if (component._disable) return;

  var props = component.props,
      state = component.state,
      context = component.context,
      previousProps = component.prevProps || props,
      previousState = component.prevState || state,
      previousContext = component.prevContext || context,
      isUpdate = component.base,
      nextBase = component.nextBase,
      initialBase = isUpdate || nextBase,
      initialChildComponent = component._component,
      skip = false,
      snapshot = previousContext,
      rendered,
      inst,
      cbase;

  if (component.constructor.getDerivedStateFromProps) {
    state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
    component.state = state;
  }

  // if updating
  if (isUpdate) {
    component.props = previousProps;
    //component.data = previousState
    component.state = previousState;
    component.context = previousContext;
    if (renderMode !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
      skip = true;
    } else {
      if (component.componentWillUpdate) {
        component.componentWillUpdate(props, state, context);
      }

      if (component.beforeUpdate) {
        component.beforeUpdate(props, state, context);
      }
    }

    // if (component.store || renderMode == FORCE_RENDER || shallowComparison(previousProps, props)) {
    //   skip = false
    //   if (component.beforeUpdate) {
    //     component.beforeUpdate(props, state, context)
    //   }
    // } else {
    //   skip = true
    // }
    component.props = props;
    component.state = state;
    //component.data = state
    component.context = context;
  }

  component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
  component._dirty = false;

  if (!skip) {
    component.beforeRender && component.beforeRender();
    rendered = component.render(props, state, context);

    //don't rerender
    if (component.constructor.css || component.css) {
      addScopedAttrStatic(rendered, '_s' + getCtorName(component.constructor));
    }

    scopeHost(rendered, component.scopedCssAttr);

    // context to pass to the child, can be updated via (grand-)parent component
    if (component.getChildContext) {
      context = extend(extend({}, context), component.getChildContext());
    }

    if (isUpdate && component.getSnapshotBeforeUpdate) {
      snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
    }

    var childComponent = rendered && rendered.nodeName,
        toUnmount,
        base,
        ctor = options.mapping[childComponent];
    if (typeof childComponent === 'function') {
      ctor = childComponent;
    }
    if (ctor) {
      // set up high order component link

      var childProps = getNodeProps(rendered);
      inst = initialChildComponent;

      if (inst && inst.constructor === ctor && childProps.key == inst.__key) {
        setComponentProps(inst, childProps, 1, context, false);
      } else {
        toUnmount = inst;

        component._component = inst = createComponent(ctor, childProps, context);
        inst.nextBase = inst.nextBase || nextBase;
        inst._parentComponent = component;
        setComponentProps(inst, childProps, 0, context, false);
        renderComponent(inst, 1, mountAll, true);
      }

      base = inst.base;
    } else {
      cbase = initialBase;

      // destroy high order component link
      toUnmount = initialChildComponent;
      if (toUnmount) {
        cbase = component._component = null;
      }

      if (initialBase || renderMode === 1) {
        if (cbase) cbase._component = null;
        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
      }
    }

    if (initialBase && base !== initialBase && inst !== initialChildComponent) {
      var baseParent = initialBase.parentNode;
      if (baseParent && base !== baseParent) {
        baseParent.replaceChild(base, initialBase);

        if (!toUnmount) {
          initialBase._component = null;
          recollectNodeTree(initialBase, false);
        }
      }
    }

    if (toUnmount) {
      unmountComponent(toUnmount);
    }

    component.base = base;
    if (base && !isChild) {
      var componentRef = component,
          t = component;
      while (t = t._parentComponent) {
(componentRef = t).base = base;
      }
      base._component = componentRef;
      base._componentConstructor = componentRef.constructor;
    }
  }

  if (!isUpdate || mountAll) {
    mounts.push(component);
  } else if (!skip) {
    // Ensure that pending componentDidMount() hooks of child components
    // are called before the componentDidUpdate() hook in the parent.
    // Note: disabled as it causes duplicate hooks, see https://github.com/developit/preact/issues/750
    // flushMounts();

    if (component.componentDidUpdate) {
      component.componentDidUpdate(previousProps, previousState, snapshot);
    }
    if (component.updated) {
      component.updated(previousProps, previousState, snapshot);
    }
    if (options.afterUpdate) options.afterUpdate(component);
  }

  if (component._renderCallbacks != null) {
    while (component._renderCallbacks.length) {
      component._renderCallbacks.pop().call(component);
    }
  }

  if (!diffLevel && !isChild) flushMounts();
}

/**
 * Apply the Component referenced by a VNode to the DOM.
 * @param {import('../dom').PreactElement} dom The DOM node to mutate
 * @param {import('../vnode').VNode} vnode A Component-referencing VNode
 * @param {object} context The current context
 * @param {boolean} mountAll Whether or not to immediately mount all components
 * @returns {import('../dom').PreactElement} The created/mutated element
 * @private
 */
function buildComponentFromVNode(dom, vnode, context, mountAll) {
  var c = dom && dom._component,
      originalComponent = c,
      oldDom = dom,
      isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
      isOwner = isDirectOwner,
      props = getNodeProps(vnode);
  while (c && !isOwner && (c = c._parentComponent)) {
    isOwner = c.constructor === vnode.nodeName;
  }

  if (c && isOwner && (!mountAll || c._component)) {
    setComponentProps(c, props, 3, context, mountAll);
    dom = c.base;
  } else {
    if (originalComponent && !isDirectOwner) {
      unmountComponent(originalComponent);
      dom = oldDom = null;
    }

    c = createComponent(vnode.nodeName, props, context, vnode);
    if (dom && !c.nextBase) {
      c.nextBase = dom;
      // passing dom/oldDom as nextBase will recycle it if unused, so bypass recycling on L229:
      oldDom = null;
    }
    setComponentProps(c, props, 1, context, mountAll);
    dom = c.base;

    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      recollectNodeTree(oldDom, false);
    }
  }

  return dom;
}

/**
 * Remove a component from the DOM and recycle it.
 * @param {import('../component').Component} component The Component instance to unmount
 * @private
 */
function unmountComponent(component) {
  if (options.beforeUnmount) options.beforeUnmount(component);

  var base = component.base;

  component._disable = true;

  if (component.componentWillUnmount) component.componentWillUnmount();

  if (component.uninstall) component.uninstall();

  if (component.store && component.store.instances) {
    for (var i = 0, len = component.store.instances.length; i < len; i++) {
      if (component.store.instances[i] === component) {
        component.store.instances.splice(i, 1);
        break;
      }
    }
  }

  component.base = null;

  // recursively tear down & recollect high-order component children:
  var inner = component._component;
  if (inner) {
    unmountComponent(inner);
  } else if (base) {
    if (base['__omiattr_'] != null) applyRef(base['__omiattr_'].ref, null);

    component.nextBase = base;

    removeNode(base);
    recyclerComponents.push(component);

    removeChildren(base);
  }

  applyRef(component.__ref, null);
}

/**
 * Base Component class.
 * Provides `setState()` and `forceUpdate()`, which trigger rendering.
 * @typedef {object} Component
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components' getChildContext
 * @public
 *
 * @example
 * class MyFoo extends Component {
 *   render(props, state) {
 *     return <div />;
 *   }
 * }
 */

var id = 0;

function Component(props, store) {
  this._dirty = true;
  this.context = store;
  this.props = props;

  this.elementId = id++;
  this.state = this.state || {};
  this.data = this.data || {};
  this._preCss = null;

  this.store = store;
  this._renderCallbacks = [];
}

extend(Component.prototype, {
  update: function update(callback) {
    this._willUpdate = true;
    if (callback) (this._renderCallbacks = this._renderCallbacks || []).push(callback);
    renderComponent(this, 2);
    if (options.componentChange) options.componentChange(this, this.base);
    this._willUpdate = false;
  },
  setState: function setState(state, callback) {
    if (!this.prevState) this.prevState = this.state;
    this.state = extend(extend({}, this.state), typeof state === 'function' ? state(this.state, this.props) : state);
    if (callback) this._renderCallbacks.push(callback);
    enqueueRender(this);
  },
  fire: function fire(type, data) {
    var _this = this;

    Object.keys(this.props).every(function (key) {
      if ('on' + type.toLowerCase() === key.toLowerCase()) {
        _this.props[key]({ detail: data });
        return false;
      }
      return true;
    });
  },
  forceUpdate: function forceUpdate(callback) {
    if (callback) this._renderCallbacks.push(callback);
    renderComponent(this, 2);
  },
  render: function render() {}
});

Component.is = 'WeElement';

/** Render JSX into a `parent` Element.
 *	@param {VNode} vnode		A (JSX) VNode to render
 *	@param {Element} parent		DOM element to render into
 *	@param {object} [store]
 *	@public
 */
function render(vnode, parent, store, empty, merge) {
  parent = typeof parent === 'string' ? document.querySelector(parent) : parent;
  if (store && (typeof store === 'string' || arguments.length === 3 && typeof Element !== undefined && (store instanceof Element || store.nodeType === 3))) {
    return diff(store, vnode, {}, false, parent, false);
  }
  obsStore(store);

  if (empty) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }

  if (merge) {
    merge = typeof merge === 'string' ? document.querySelector(merge) : merge;
  }

  return diff(merge, vnode, store, false, parent, false);
}

function obsStore(store) {
  if (store && store.data) {
    store.instances = [];
    extendStoreUpate(store);

    obaa(store.data, function (prop, val, old, path) {
      var patchs = {};
      var key = fixPath(path + '-' + prop);
      patchs[key] = true;
      store.update(patchs);
    });
  }
}

function merge(vnode, merge, store) {
  obsStore(store);

  merge = typeof merge === 'string' ? document.querySelector(merge) : merge;

  return diff(merge, vnode, store);
}

function extendStoreUpate(store) {
  store.update = function (patch) {
    var _this = this;

    var updateAll = matchGlobalData(this.globalData, patch);
    if (Object.keys(patch).length > 0) {
      this.instances.forEach(function (instance) {
        if (updateAll || _this.updateAll || instance.constructor.updatePath && needUpdate(patch, instance.constructor.updatePath) || instance._updatePath && needUpdate(patch, instance._updatePath)) {
          //update this.use
          if (instance.constructor.use) {
            instance.use = getUse(store.data, instance.constructor.use);
          } else if (instance.initUse) {
            instance.use = getUse(store.data, instance.initUse());
          }

          instance.update();
        }
      });
      this.onChange && this.onChange(patch);
    }
  };
}

function matchGlobalData(globalData, diffResult) {
  if (!globalData) return false;
  for (var keyA in diffResult) {
    if (globalData.indexOf(keyA) > -1) {
      return true;
    }
    for (var i = 0, len = globalData.length; i < len; i++) {
      if (includePath(keyA, globalData[i])) {
        return true;
      }
    }
  }
  return false;
}

function needUpdate(diffResult, updatePath) {
  for (var keyA in diffResult) {
    if (updatePath[keyA]) {
      return true;
    }
    for (var keyB in updatePath) {
      if (includePath(keyA, keyB)) {
        return true;
      }
    }
  }
  return false;
}

function includePath(pathA, pathB) {
  if (pathA.indexOf(pathB) === 0) {
    var next = pathA.substr(pathB.length, 1);
    if (next === '[' || next === '.') {
      return true;
    }
  }
  return false;
}

function fixPath(path) {
  var mpPath = '';
  var arr = path.replace('#-', '').split('-');
  arr.forEach(function (item, index) {
    if (index) {
      if (isNaN(Number(item))) {
        mpPath += '.' + item;
      } else {
        mpPath += '[' + item + ']';
      }
    } else {
      mpPath += item;
    }
  });
  return mpPath;
}

function rpx(str) {
  return str.replace(/([1-9]\d*|0)(\.\d*)*rpx/g, function (a, b) {
    return window.innerWidth * Number(b) / 750 + 'px';
  });
}

function tag(name) {
  return function (target) {
    define(name, target);
  };
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ModelView = function (_Component) {
  _inherits(ModelView, _Component);

  function ModelView() {
    _classCallCheck(this, ModelView);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  ModelView.prototype.beforeInstall = function beforeInstall() {
    this.data = this.vm.data;
  };

  return ModelView;
}(Component);

ModelView.observe = true;
ModelView.mergeUpdate = true;

/**
 * classNames based on https://github.com/JedWatson/classnames
 * by Jed Watson
 * Licensed under the MIT License
 * https://github.com/JedWatson/classnames/blob/master/LICENSE
 * modified by dntzhang
 */

var hasOwn = {}.hasOwnProperty;

function classNames() {
  var classes = [];

  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (!arg) continue;

    var argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg) && arg.length) {
      var inner = classNames.apply(null, arg);
      if (inner) {
        classes.push(inner);
      }
    } else if (argType === 'object') {
      for (var key in arg) {
        if (hasOwn.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

function extractClass() {
  var _Array$prototype$slic = Array.prototype.slice.call(arguments, 0),
      props = _Array$prototype$slic[0],
      args = _Array$prototype$slic.slice(1);

  if (props) {
    if (props['class']) {
      args.unshift(props['class']);
      delete props['class'];
    } else if (props.className) {
      args.unshift(props.className);
      delete props.className;
    }
  }
  if (args.length > 0) {
    return { class: classNames.apply(null, args) };
  }
}

function getHost(component) {
  var base = component.base;
  if (base) {
    while (base.parentNode) {
      if (base.parentNode._component) {
        return base.parentNode._component;
      } else {
        base = base.parentNode;
      }
    }
  }
}

/**
 * preact-render-to-string based on preact-render-to-string
 * by Jason Miller
 * Licensed under the MIT License
 * https://github.com/developit/preact-render-to-string
 *
 * modified by dntzhang
 */

var encodeEntities = function encodeEntities(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

var indent = function indent(s, char) {
  return String(s).replace(/(\n+)/g, '$1' + (char || '\t'));
};

var mapping$1 = options.mapping;

var VOID_ELEMENTS = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

var isLargeString = function isLargeString(s, length, ignoreLines) {
  return String(s).length > (length || 40) || !ignoreLines && String(s).indexOf('\n') !== -1 || String(s).indexOf('<') !== -1;
};

var JS_TO_CSS = {};

// Convert an Object style to a CSSText string
function styleObjToCss(s) {
  var str = '';
  for (var prop in s) {
    var val = s[prop];
    if (val != null) {
      if (str) str += ' ';
      // str += jsToCss(prop);
      str += JS_TO_CSS[prop] || (JS_TO_CSS[prop] = prop.replace(/([A-Z])/g, '-$1').toLowerCase());
      str += ': ';
      str += val;
      if (typeof val === 'number' && IS_NON_DIMENSIONAL.test(prop) === false) {
        str += 'px';
      }
      str += ';';
    }
  }
  return str || undefined;
}

function renderToString(vnode, opts, store, isSvgMode) {
  store = store || {};
  opts = Object.assign({
    scopedCSS: true
  }, opts);
  var css = {};
  var html = _renderToString(vnode, opts, store, isSvgMode, css);
  return {
    css: Object.values(css),
    html: html
  };
}

/** The default export is an alias of `render()`. */
function _renderToString(vnode, opts, store, isSvgMode, css) {
  if (vnode == null || typeof vnode === 'boolean') {
    return '';
  }

  var nodeName = vnode.nodeName,
      attributes = vnode.attributes,
      isComponent = false;

  var pretty = true && opts.pretty,
      indentChar = pretty && typeof pretty === 'string' ? pretty : '\t';

  // #text nodes
  if (typeof vnode !== 'object' && !nodeName) {
    return encodeEntities(vnode);
  }

  // components
  var ctor = mapping$1[nodeName];
  if (ctor) {
    isComponent = true;

    var props = getNodeProps$1(vnode),
        rendered;
    // class-based components
    var c = new ctor(props, store);
    // turn off stateful re-rendering:
    c._disable = c.__x = true;
    c.props = props;
    c.store = store;
    if (c.install) c.install();
    if (c.beforeRender) c.beforeRender();
    rendered = c.render(c.props, c.data, c.store);

    if (opts.scopedCSS) {
      if (c.constructor.css || c.css) {
        var cssStr = c.constructor.css ? c.constructor.css : typeof c.css === 'function' ? c.css() : c.css;
        var cssAttr = '_s' + getCtorName(c.constructor);
        css[cssAttr] = {
          id: cssAttr,
          css: scoper(cssStr, cssAttr)
        };
        addScopedAttrStatic(rendered, cssAttr);
      }

      c.scopedCSSAttr = vnode.css;
      scopeHost(rendered, c.scopedCSSAttr);
    }

    return _renderToString(rendered, opts, store, false, css);
  }

  // render JSX to HTML
  var s = '',
      html;

  if (attributes) {
    var attrs = Object.keys(attributes);

    // allow sorting lexicographically for more determinism (useful for tests, such as via preact-jsx-chai)
    if (opts && opts.sortAttributes === true) attrs.sort();

    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i],
          v = attributes[name];
      if (name === 'children') continue;

      if (name.match(/[\s\n\\/='"\0<>]/)) continue;

      if (!(opts && opts.allAttributes) && (name === 'key' || name === 'ref')) continue;

      if (name === 'className') {
        if (attributes['class']) continue;
        name = 'class';
      } else if (isSvgMode && name.match(/^xlink:?./)) {
        name = name.toLowerCase().replace(/^xlink:?/, 'xlink:');
      }

      if (name === 'style' && v && typeof v === 'object') {
        v = styleObjToCss(v);
      }

      var hooked = opts.attributeHook && opts.attributeHook(name, v, store, opts, isComponent);
      if (hooked || hooked === '') {
        s += hooked;
        continue;
      }

      if (name === 'dangerouslySetInnerHTML') {
        html = v && v.__html;
      } else if ((v || v === 0 || v === '') && typeof v !== 'function') {
        if (v === true || v === '') {
          v = name;
          // in non-xml mode, allow boolean attributes
          if (!opts || !opts.xml) {
            s += ' ' + name;
            continue;
          }
        }
        s += ' ' + name + '="' + encodeEntities(v) + '"';
      }
    }
  }

  // account for >1 multiline attribute
  if (pretty) {
    var sub = s.replace(/^\n\s*/, ' ');
    if (sub !== s && !~sub.indexOf('\n')) s = sub;else if (pretty && ~s.indexOf('\n')) s += '\n';
  }

  s = '<' + nodeName + s + '>';
  if (String(nodeName).match(/[\s\n\\/='"\0<>]/)) throw s;

  var isVoid = String(nodeName).match(VOID_ELEMENTS);
  if (isVoid) s = s.replace(/>$/, ' />');

  var pieces = [];
  if (html) {
    // if multiline, indent.
    if (pretty && isLargeString(html)) {
      html = '\n' + indentChar + indent(html, indentChar);
    }
    s += html;
  } else if (vnode.children) {
    var hasLarge = pretty && ~s.indexOf('\n');
    for (var i = 0; i < vnode.children.length; i++) {
      var child = vnode.children[i];
      if (child != null && child !== false) {
        var childSvgMode = nodeName === 'svg' ? true : nodeName === 'foreignObject' ? false : isSvgMode,
            ret = _renderToString(child, opts, store, childSvgMode, css);
        if (pretty && !hasLarge && isLargeString(ret)) hasLarge = true;
        if (ret) pieces.push(ret);
      }
    }
    if (pretty && hasLarge) {
      for (var i = pieces.length; i--;) {
        pieces[i] = '\n' + indentChar + indent(pieces[i], indentChar);
      }
    }
  }

  if (pieces.length) {
    s += pieces.join('');
  } else if (opts && opts.xml) {
    return s.substring(0, s.length - 1) + ' />';
  }

  if (!isVoid) {
    if (pretty && ~s.indexOf('\n')) s += '\n';
    s += '</' + nodeName + '>';
  }

  return s;
}

function assign$1(obj, props) {
  for (var i in props) {
    obj[i] = props[i];
  }return obj;
}

function getNodeProps$1(vnode) {
  var props = assign$1({}, vnode.attributes);
  props.children = vnode.children;

  var defaultProps = vnode.nodeName.defaultProps;
  if (defaultProps !== undefined) {
    for (var i in defaultProps) {
      if (props[i] === undefined) {
        props[i] = defaultProps[i];
      }
    }
  }

  return props;
}

var n=function(t,r,u,e){for(var p=1;p<r.length;p++){var s=r[p++],a="number"==typeof s?u[s]:s;1===r[p]?e[0]=a:2===r[p]?(e[1]=e[1]||{})[r[++p]]=a:3===r[p]?e[1]=Object.assign(e[1]||{},a):e.push(r[p]?t.apply(null,n(t,a,u,["",null])):a);}return e},t=function(n){for(var t,r,u=1,e="",p="",s=[0],a=function(n){1===u&&(n||(e=e.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?s.push(n||e,0):3===u&&(n||e)?(s.push(n||e,1), u=2):2===u&&"..."===e&&n?s.push(n,3):2===u&&e&&!n?s.push(!0,2,e):4===u&&r&&(s.push(n||e,2,r), r=""), e="";},f=0;f<n.length;f++){f&&(1===u&&a(), a(f));for(var h=0;h<n[f].length;h++)t=n[f][h], 1===u?"<"===t?(a(), s=[s], u=3):e+=t:p?t===p?p="":e+=t:'"'===t||"'"===t?p=t:">"===t?(a(), u=1):u&&("="===t?(u=4, r=e, e=""):"/"===t?(a(), 3===u&&(s=s[0]), u=s, (s=s[0]).push(u,4), u=0):" "===t||"\t"===t||"\n"===t||"\r"===t?(a(), u=2):e+=t);}return a(), s},r="function"==typeof Map,u=r?new Map:{},e=r?function(n){var r=u.get(n);return r||u.set(n,r=t(n)), r}:function(n){for(var r="",e=0;e<n.length;e++)r+=n[e].length+"-"+n[e];return u[r]||(u[r]=t(n))};function htm(t){var r=n(this,e(t),arguments,[]);return r.length>1?r:r[0]}

var ARR = [];

// This API is completely unnecessary for Preact, so it's basically passthrough.
var Children = {
	map: function map(children, fn, ctx) {
		if (children == null) return null;
		children = Children.toArray(children);
		if (ctx && ctx !== children) fn = fn.bind(ctx);
		return children.map(fn);
	},
	forEach: function forEach(children, fn, ctx) {
		if (children == null) return null;
		children = Children.toArray(children);
		if (ctx && ctx !== children) fn = fn.bind(ctx);
		children.forEach(fn);
	},
	count: function count(children) {
		return children && children.length || 0;
	},
	only: function only(children) {
		children = Children.toArray(children);
		if (children.length !== 1) throw new Error('Children.only() expects only one child.');
		return children[0];
	},
	toArray: function toArray(children) {
		if (children == null) return [];
		return ARR.concat(children);
	}
};

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Inlined Object.is polyfill.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function objectIs(x, y) {
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}
var id$1 = 0;
function createEventEmitter(value) {
  var handlers = [];
  return {
    on: function on(handler) {
      handlers.push(handler);
    },
    off: function off(handler) {
      handlers = handlers.filter(function (h) {
        return h !== handler;
      });
    },
    get: function get() {
      return value;
    },
    set: function set(newValue, changedBits) {
      value = newValue;
      handlers.forEach(function (handler) {
        return handler(value, changedBits);
      });
    }
  };
}

function onlyChild(children) {
  return Array.isArray(children) ? children[0] : children;
}

function createContext(defaultValue, calculateChangedBits) {
  var contextProp = '__create-react-context-' + id$1++ + '__';

  var Provider = function (_Component) {
    _inherits$1(Provider, _Component);

    function Provider() {
      var _temp, _this, _ret;

      _classCallCheck$1(this, Provider);

      for (var _len = arguments.length, args = Array(_len), key = 0; key < _len; key++) {
        args[key] = arguments[key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$1(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.emitter = createEventEmitter(_this.props.value), _temp), _possibleConstructorReturn$1(_this, _ret);
    }

    // static childContextTypes = {
    //   [contextProp]: PropTypes.object.isRequired
    // };

    Provider.prototype.getChildContext = function getChildContext() {
      var _ref;

      return _ref = {}, _ref[contextProp] = this.emitter, _ref;
    };

    Provider.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      if (this.props.value !== nextProps.value) {
        var oldValue = this.props.value;
        var newValue = nextProps.value;
        var changedBits;

        if (objectIs(oldValue, newValue)) {
          changedBits = 0; // No change
        } else {
          changedBits = typeof calculateChangedBits === 'function' ? calculateChangedBits(oldValue, newValue) : 1073741823;
          if (process.env.NODE_ENV !== 'production') {
            // warning(
            //   (changedBits & MAX_SIGNED_31_BIT_INT) === changedBits,
            //   'calculateChangedBits: Expected the return value to be a ' +
            //     '31-bit integer. Instead received: %s',
            //   changedBits
            // );
          }

          changedBits |= 0;

          if (changedBits !== 0) {
            this.emitter.set(nextProps.value, changedBits);
          }
        }
      }
    };

    Provider.prototype.render = function render() {
      return this.props.children;
    };

    return Provider;
  }(Component);

  var Consumer = function (_Component2) {
    _inherits$1(Consumer, _Component2);

    function Consumer() {
      var _temp2, _this2, _ret2;

      _classCallCheck$1(this, Consumer);

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _ret2 = (_temp2 = (_this2 = _possibleConstructorReturn$1(this, _Component2.call.apply(_Component2, [this].concat(args))), _this2), _this2.state = {
        value: _this2.getValue()
      }, _this2.onUpdate = function (newValue, changedBits) {
        var observedBits = _this2.observedBits | 0;
        if ((observedBits & changedBits) !== 0) {
          _this2.setState({ value: _this2.getValue() });
        }
      }, _temp2), _possibleConstructorReturn$1(_this2, _ret2);
    }
    // static contextTypes = {
    //   [contextProp]: PropTypes.object
    // };

    Consumer.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      var observedBits = nextProps.observedBits;

      this.observedBits = observedBits === undefined || observedBits === null ? 1073741823
      : observedBits;
    };

    Consumer.prototype.componentDidMount = function componentDidMount() {
      if (this.context && this.context[contextProp]) {
        this.context[contextProp].on(this.onUpdate);
      }
      var observedBits = this.props.observedBits;

      this.observedBits = observedBits === undefined || observedBits === null ? 1073741823
      : observedBits;
    };

    Consumer.prototype.componentWillUnmount = function componentWillUnmount() {
      if (this.context && this.context[contextProp]) {
        this.context[contextProp].off(this.onUpdate);
      }
    };

    Consumer.prototype.getValue = function getValue() {
      if (this.context && this.context[contextProp]) {
        return this.context[contextProp].get();
      } else {
        return defaultValue;
      }
    };

    Consumer.prototype.render = function render() {
      return onlyChild(this.props.children)(this.state.value);
    };

    return Consumer;
  }(Component);

  return {
    Provider: Provider,
    Consumer: Consumer
  };
}

function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var html = htm.bind(h);

var WeElement = Component;
var defineElement = define;
function createRef() {
	return {};
}

var REACT_ELEMENT_TYPE = typeof Symbol !== 'undefined' && Symbol.for && Symbol.for('react.element') || 0xeac7;

function isValidElement(element) {
	return element && (element instanceof VNode || element.$$typeof === REACT_ELEMENT_TYPE);
}

var ContextProvider = function () {
	function ContextProvider() {
		_classCallCheck$2(this, ContextProvider);
	}

	ContextProvider.prototype.getChildContext = function getChildContext() {
		return this.props.context;
	};

	ContextProvider.prototype.render = function render$$1(props) {
		return props.children[0];
	};

	return ContextProvider;
}();

function renderSubtreeIntoContainer(parentComponent, vnode, container, callback) {
	var wrap = h(ContextProvider, { context: parentComponent.context }, vnode);
	var renderContainer = render(wrap, container);
	var component = renderContainer._component || renderContainer.base;
	if (callback) callback.call(component, renderContainer);
	return component;
}

var unstable_renderSubtreeIntoContainer = renderSubtreeIntoContainer;

function Portal(props) {
	renderSubtreeIntoContainer(this, props.vnode, props.container);
}

function createPortal(vnode, container) {
	return h(Portal, { vnode: vnode, container: container });
}

function findDOMNode(component) {
	return component && (component.base || component.nodeType === 1 && component) || null;
}

function unmountComponentAtNode(container) {
	var existing = container._preactCompatRendered && container._preactCompatRendered.base;
	if (existing && existing.parentNode === container) {
		render(h(EmptyComponent), container, existing);
		return true;
	}
	return false;
}

function shallowDiffers(a, b) {
	for (var i in a) {
		if (!(i in b)) return true;
	}for (var i in b) {
		if (a[i] !== b[i]) return true;
	}return false;
}

function callMethod(ctx, m, args) {
	if (typeof m === 'string') {
		m = ctx.constructor.prototype[m];
	}
	if (typeof m === 'function') {
		return m.apply(ctx, args);
	}
}

function multihook(hooks, skipDuplicates) {
	return function () {
		var ret;
		for (var i = 0; i < hooks.length; i++) {
			var r = callMethod(this, hooks[i], arguments);

			if (skipDuplicates && r != null) {
				if (!ret) ret = {};
				for (var key in r) {
					if (r.hasOwnProperty(key)) {
						ret[key] = r[key];
					}
				}
			} else if (typeof r !== 'undefined') ret = r;
		}
		return ret;
	};
}

function newComponentHook(props, context) {
	propsHook.call(this, props, context);
	this.componentWillReceiveProps = multihook([propsHook, this.componentWillReceiveProps || 'componentWillReceiveProps']);
	this.render = multihook([propsHook, beforeRender, this.render || 'render', afterRender]);
}

function propsHook(props, context) {
	if (!props) return;

	// React annoyingly special-cases single children, and some react components are ridiculously strict about this.
	var c = props.children;
	if (c && Array.isArray(c) && c.length === 1 && (typeof c[0] === 'string' || typeof c[0] === 'function' || c[0] instanceof VNode)) {
		props.children = c[0];

		// but its totally still going to be an Array.
		if (props.children && typeof props.children === 'object') {
			props.children.length = 1;
			props.children[0] = props.children;
		}
	}

	// add proptype checking
	if (DEV) {
		var ctor = typeof this === 'function' ? this : this.constructor,
		    propTypes = this.propTypes || ctor.propTypes;
		var displayName = this.displayName || ctor.name;

		// if (propTypes) {
		// 	PropTypes.checkPropTypes(propTypes, props, 'prop', displayName);
		// }
	}
}

function beforeRender(props) {
	currentComponent = this;
}

function afterRender() {
	if (currentComponent === this) {
		currentComponent = null;
	}
}

function _Component(props, context, opts) {
	Component.call(this, props, context);
	this.state = this.getInitialState ? this.getInitialState() : {};
	this.refs = {};
	this._refProxies = {};
	if (opts !== BYPASS_HOOK) {
		newComponentHook.call(this, props, context);
	}
}
extend(_Component.prototype = new Component(), {
	constructor: _Component,

	isReactComponent: {},

	replaceState: function replaceState(state, callback) {
		this.setState(state, callback);
		for (var i in this.state) {
			if (!(i in state)) {
				delete this.state[i];
			}
		}
	},
	getDOMNode: function getDOMNode() {
		return this.base;
	},
	isMounted: function isMounted() {
		return !!this.base;
	}
});

function F() {}

function PureComponent(props, context) {
	_Component.call(this, props, context);
}
F.prototype = _Component.prototype;
PureComponent.prototype = new F();
PureComponent.prototype.isPureReactComponent = true;
PureComponent.prototype.shouldComponentUpdate = function (props, state) {
	return shallowDiffers(this.props, props) || shallowDiffers(this.state, state);
};

options.root.Omi = {
	h: h,
	createElement: h,
	cloneElement: cloneElement,
	createRef: createRef,
	Component: Component,
	render: render,
	rerender: rerender,
	options: options,
	WeElement: WeElement,
	define: define,
	rpx: rpx,
	ModelView: ModelView,
	defineElement: defineElement,
	classNames: classNames,
	extractClass: extractClass,
	getHost: getHost,
	renderToString: renderToString,
	tag: tag,
	merge: merge,
	html: html,
	htm: htm,
	Children: Children,
	isValidElement: isValidElement,
	createPortal: createPortal,
	findDOMNode: findDOMNode,
	unmountComponentAtNode: unmountComponentAtNode,
	unstable_renderSubtreeIntoContainer: unstable_renderSubtreeIntoContainer,
	PureComponent: PureComponent,
	createContext: createContext
};
options.root.omi = options.root.Omi;
options.root.Omi.version = 'reomio-1.0.1';

var omi = {
	h: h,
	createElement: h,
	cloneElement: cloneElement,
	createRef: createRef,
	Component: Component,
	render: render,
	rerender: rerender,
	options: options,
	WeElement: WeElement,
	define: define,
	rpx: rpx,
	ModelView: ModelView,
	defineElement: defineElement,
	classNames: classNames,
	extractClass: extractClass,
	getHost: getHost,
	renderToString: renderToString,
	tag: tag,
	merge: merge,
	html: html,
	htm: htm,
	Children: Children,
	isValidElement: isValidElement,
	createPortal: createPortal,
	findDOMNode: findDOMNode,
	unmountComponentAtNode: unmountComponentAtNode,
	unstable_renderSubtreeIntoContainer: unstable_renderSubtreeIntoContainer,
	PureComponent: PureComponent,
	createContext: createContext
};

export default omi;
export { h, h as createElement, cloneElement, createRef, Component, render, rerender, options, WeElement, define, rpx, ModelView, defineElement, classNames, extractClass, getHost, renderToString, tag, merge, html, htm, Children, isValidElement, createPortal, findDOMNode, unmountComponentAtNode, unstable_renderSubtreeIntoContainer, PureComponent, createContext };
//# sourceMappingURL=omi.esm.js.map
