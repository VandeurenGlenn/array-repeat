'use strict';
/**
 * @class ArrayRepeat
 */
class ArrayRepeat extends HTMLElement {
  /**
   * @return {array} ['items', 'name-space']
   */
  static get observedAttributes() {
    return ['items', 'name-space', 'max'];
  }
  /**
   * constructor
   */
  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this._onScroll = this._onScroll.bind(this);
    this.style.transform = 'translateZ(0)';
  }
  /**
   * connectedCallback
   */
  connectedCallback() {
    if (this.max) {
      this.style.overflowY = 'scroll';
      this.addEventListener('scroll', this._onScroll, {capture: true});
    }
    this.nameSpace = 'item';
    this[this.nameSpace] = [];
    this._templateStyles = this.querySelectorAll('style');
  }
  /**
   * @param {string} value updates the 'name-space' attribute with given value.
   */
  set nameSpace(value) {
    if (value) {
      this.setAttribute('name-space', value);
    } else {
      this.removeAttribute('name-space');
    }
  }
  /**
   * @return {string} value of 'name-space' attribute
   */
  get nameSpace() {
    return this.getAttribute('name-space') || null;
  }
  /**
   * @param {string} value
   */
  set items(value) {
    this._items = this._validate(value);
    this.render();
  }
  /**
   * @param {number} value The number of items to display until scroll happened
   */
  set max(value) {
    this._max = this._validateMax(value);
  }
  /**
   * @param {array} value
   */
  set tasks(value) {
    this._tasks = value;
  }
  /**
   * @return {array} tasks
   */
  get tasks() {
    return this._tasks || [];
  }

  /**
   * @param {array} value
   */
  set calls(value) {
    this._calls = value;
  }
  /**
   * @return {array} tasks
   */
  get calls() {
    return this._calls || 0;
  }
  /**
   * @return {Array} [{}]
   */
  get items() {
    return this._items;
  }
  /**
   * @return {number} The number of items to display until scroll happens
   */
  get max() {
    return this._max || 10;
  }
  /**
   * @return {HTMLElement} template
   */
  get __itemTemplate() {
    let template = this.querySelector('template');
    if (template && template.localName === 'template') {
      this._itemTemplate = template;
      return template;
    } else {
      return null;
    }
  }
  /**
   * @return {HTMLElement} template
   */
  get itemTemplate() {
    return this._itemTemplate || this.__itemTemplate;
  }
  /**
   * @return {array} style's defined in template
   */
  get templateStyles() {
    return this._templateStyles || this.querySelectorAll('style');
  }
  /**
   * Attribute observer
   * @param {string} name the name of the attribute that changed
   *
   * @param {(string|object|array)} oldVal
   *  the previous value of the attribute that changed.
   *
   * @param {(string|object|array)} newVal
   *  the value of the attribute that changed.
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      if (name === 'name-space') {
        if (oldVal) {
          delete this[this.previousNameSpace];
        } else if (newVal) {
          this[newVal] = [];
          this.previousNameSpace = newVal;
        }
      } else if(name === 'items') {
        this.items = JSON.parse(newVal);
      } else {
        this[name] = newVal;
      }
    }
  }
  /**
   * @param {array|object} items
   * @return {array} items or error
   */
  _validate(items) {
    if (typeof items === 'object') {
      // when we have a length prop, the object is probably an array
      if (items.length) {
        return items;
      } else {
        return this._objectToArray(items);
      }
    }
    return console.error('items is not a typeof object');
  }
  /**
   * @param {number} max
   * @return {number} max or undefined
   */
  _validateMax(max) {
    max = Number(max);
    if (typeof max === 'NaN') {
      console.error('max is not a typeof number');
      return undefined;
    }
    return max;
  }
  /**
   * @param {object} object
   * @return {array} constructed array from object
   */
  _objectToArray(object) {
    let array = [];
    for (let prop of Object.keys(object)) {
      if (typeof object[prop] === 'object') {
        array.push(object[prop]);
      } else {
        array[prop] = object[prop];
      }
    }
    return array;
  }
  /**
   * forces an update
   */
  render() {
    this._itemTemplate = null;
    this._setupItems(this.items);
  }
  /**
   * @param {array} items A list with items to display.
   */
  _setupItems(items) {
    try {
      let collection = [];
      for (let item of items) {
        this._setupItem(this.itemTemplate.innerHTML, item)
        .then(result => {
          collection.push(result);
          if (items.length === collection.length) {
            this._constructInnerHTML(collection).then(innerHTML => {
              this._setShadowRoot(innerHTML);
            });
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
  /**
   * @param {string} innerHTML
   * @param {array} item
   * @return {promise} promise
   */
  _setupItem(innerHTML, item) {
    return new Promise((resolve, reject) => {
        this._forOf(item).then(tasks => {
          for (let task of tasks) {
            innerHTML = this._constructItemInnerHTML(task, innerHTML);
          }
          resolve(innerHTML);
        });
        // for (let prop of Object.keys(item)) {
        //   innerHTML = innerHTML
        //     .replace(`[[${this.nameSpace}.${prop}]]`, item[prop]);
        // }
        // resolve(innerHTML);
    });
  }
  /**
   * @param {object} item
   * @param {string} inner the innerHTML to perform changes on
   * @return {string} innerHTML
   */
  _constructItemInnerHTML(item, inner) {
    item.name = `[[${this.nameSpace}.${item.key}]]`;
    inner = inner.replace(item.name, item.value);
    return inner;
  }
  /**
   * custom for of loop that returns an array & reruns when an object is found
   * @param {object} item
   * @return {resolve} promises an array of tasks
   */
  _forOf(item) {
    return new Promise((resolve, reject) => {
      let oldKey;
      if (item.key) {
        oldKey = item.key;
        item = item.value;
      }
      for (let key of Object.keys(item)) {
        let _key = key;
        if (oldKey) {
          _key = `${oldKey}.${key}`;
        }
        if (typeof item[key] === 'object') {
          this._forOf({value: item[key], key: _key});
        } else {
          this.tasks.push({value: item[key], key: _key});
          this.tasks = this.tasks;
          this.calls += 1;
        }
      }
      if ((this.tasks.length + 1) === this.calls) {
        return resolve(this.tasks);
      }
    });
  }
  /**
   * Constructs innerHTML with given array
   * @param {array} items the array to create a string from
   * @return {promise} promise
   */
  _constructInnerHTML(items) {
    return new Promise((resolve, reject) => {
      let innerHTML = '';
      let calls = 0;
      this.queriedCollection = undefined;
      for (let item of items) {
        calls += 1;
        innerHTML += item;
        if (this.max !== undefined &&
            calls === this.max) {
          this._queryItems(items, this.max);
          return resolve(innerHTML);
        } else if (items.length === calls &&
                  calls < this.max &&
                  this.max !== undefined) {
          resolve(innerHTML);
        }
      }
    });
  }
  /**
   * Setup shadowRoot content
   * @param {string} innerHTML
   */
  _setShadowRoot(innerHTML) {
    this.root.innerHTML = innerHTML;

    if (!this.root.querySelector('style')) {
      for (let style of this.templateStyles) {
        this.root.appendChild(style);
      }
      this.itemHeight = this.root.children[0].offsetHeight;
    }
  }
  /**
   * Update shadowRoot content
   * @param {string} innerHTML
   */
  _updateShadowRoot(innerHTML) {
    let innerRoot = this.root.innerHTML;
    innerRoot += innerHTML;
    requestAnimationFrame(() => {
      this.root.innerHTML = innerRoot;
    });
  }
  /**
   * Queries items for contructing after scroll
   * @param {array} collection
   * @param {number} max
   */
  _queryItems(collection, max) {
    collection = collection.slice(max, collection.length);
    this.queriedCollection = collection;
  }
  /**
   * Updates the shadowRoot when there is an queriedCollection
   */
  _onScroll() {
    if (this.queriedCollection !== undefined) {
      this._constructInnerHTML(this.queriedCollection).then(innerHTML => {
        this._updateShadowRoot(innerHTML);
      });
    } else if (this.queriedCollection === undefined) {
      let timeout = () => {
        setTimeout(() => {
          if (this.queriedCollection !== undefined) {
            clearTimeout(timeout);
          }
          this.removeEventListener('scroll', this._onScroll);
        }, 500);
      };
      timeout();
    }
  }
}
customElements.define('array-repeat', ArrayRepeat);
