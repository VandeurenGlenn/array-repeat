'use strict';
/**
 * @class ArrayRepeat
 */
class ArrayRepeat extends HTMLElement {
  /**
   * Returns the element name.
   * @return {string} 'array-repeat';
   */
  static get is() {
    return 'array-repeat';
  }
  /**
   * Configuration of the element
   * @return {object} {properties: {}, observers: [], etc}
   */
  static get config() {
    return {
      properties: {
        items: Array,
        nameSpace: {
          type: String,
          value: 'item'
        }
      }
    };
  }
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

    this._onScroll = this._onScroll.bind(this);
  }
  /**
   * connectedCallback
   */
  connectedCallback() {
    this._root = this.attachShadow({mode: 'open'});
    if (this.max) {
      this.style.overflowY = 'scroll';
      this.addEventListener('scroll', this._onScroll);
    }
    this.nameSpace = 'item';
    this[this.nameSpace] = [];
    this._templateStyles = this.querySelectorAll('style');
  }
  /**
   * Setter
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
   * Setter
   * @param {string} value updates the 'items' attribute with given value.
   */
  set items(value) {
    if (value) {
      this.setAttribute('items', JSON.stringify(value));
    } else {
      this.removeAttribute('items');
    }
  }
  /**
   * Setter
   * @param {number} value The number of items to display until scroll happened
   */
  set max(value) {
    if (value) {
      this.setAttribute('max', JSON.stringify(value));
    } else {
      this.removeAttribute('max');
    }
  }
  /**
   * Getter
   * @return {number} The number of items to display until scroll happened
   */
  get max() {
    return Number(this.getAttribute('max'));
  }
  /**
   * Getter
   * @return {HTMLElement} template
   */
  get __itemTemplate() {
    let child = this.querySelector('template');
    if (child && child.localName === 'template') {
      this._itemTemplate = child;
      return child;
    } else {
      return null;
    }
  }
  /**
   * Getter
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
        this._updateItems(JSON.parse(newVal));
      }
    }
  }
  /**
   * forces an update
   */
  render() {
    this._itemTemplate = null;
    this._updateItems(this.items);
  }
  /**
   * @param {array} items A list with items to display.
   */
  _updateItems(items) {
    this._setupItems(items);
  }
  /**
   * @param {array} items
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
        for (let prop of Object.keys(item)) {
          innerHTML = innerHTML
            .replace(`[[${this.nameSpace}.${prop}]]`, item[prop]);
        }
        resolve(innerHTML);
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
    this._root.innerHTML = innerHTML;

    if (!this._root.querySelector('style')) {
      for (let style of this.templateStyles) {
        this._root.appendChild(style);
      }
      this.itemHeight = this._root.querySelector('.item').offsetHeight;
    }
  }
  /**
   * Update shadowRoot content
   * @param {string} innerHTML
   */
  _updateShadowRoot(innerHTML) {
    this._root.innerHTML += innerHTML;
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
        requestAnimationFrame(() => {
          this._updateShadowRoot(innerHTML);
        });
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
customElements.define(ArrayRepeat.is, ArrayRepeat);
