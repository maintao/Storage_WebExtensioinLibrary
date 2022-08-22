"use strict";

/**
 * An utility class to access chrome.storage https://developer.chrome.com/docs/extensions/reference/storage/
 * It has memory cache, make reading faster.
 * The cache will keep updated, no worry about it.
 * It can be used in popup, content scripts, and background web worker.
 */
export default class Storage {
  /**
   * Recursively use Object.freeze() to make an object unchangable
   * @param {object} objectToFreeze
   * @returns {object}
   */
  static #deepFreeze(objectToFreeze) {
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(objectToFreeze);

    // Freeze properties before freezing self
    for (const name of propNames) {
      const value = objectToFreeze[name];

      if (value && typeof value === "object") {
        Storage.#deepFreeze(value);
      }
    }

    return Object.freeze(objectToFreeze);
  }

  /**
   * Creates an instance of Storage
   *
   * @param {StorageArea} storageArea https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea
   */
  constructor(storageArea) {
    if (storageArea !== chrome.storage.sync && storageArea !== chrome.storage.local) {
      throw new Error("storageArea must be chrome.storage.sync or chrome.storage.local");
    }

    this.storageArea = storageArea;
    this.cache = {};
    this.allCached = false;

    this.storageArea.onChanged.addListener((changes) => {
      console.log("changes", changes);
      let patch = {};
      for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        patch[key] = newValue;
      }
      this.cache = Object.assign({}, this.cache, patch);
      Storage.#deepFreeze(this.cache);
    });
  }

  /**
   * Gets a property in storage
   * @param {string} key The property's key in storage
   * @returns {Promise<any>}
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      if (this.cache.hasOwnProperty(key)) {
        resolve(this.cache[key]);
      } else {
        this.storageArea.get(key, (storage) => {
          // Pass any observed errors down the promise chain.
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          this.cache = Object.assign({}, this.cache, { [key]: storage[key] });
          Storage.#deepFreeze(this.cache);
          // Pass the data retrieved from storage down the promise chain.
          resolve(this.cache[key]);
        });
      }
    });
  }

  /**
   * Gets all properties in storage
   * @returns {Promise<object>}
   */
  async getAll() {
    return new Promise((resolve, reject) => {
      if (this.allCached) {
        resolve(this.cache);
      } else {
        this.storageArea.get(null, (storage) => {
          // Pass any observed errors down the promise chain.
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          this.cache = storage;
          Storage.#deepFreeze(this.cache);
          this.allCached = true;
          // Pass the data retrieved from storage down the promise chain.
          resolve(this.cache);
        });
      }
    });
  }

  /**
   * Set multiple properties
   * @param {object} itemsObject Like {key1: xx, key2: xx}
   * @returns
   */
  async set(itemsObject) {
    return new Promise((resolve, reject) => {
      this.storageArea.set(itemsObject, () => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Pass the data retrieved from storage down the promise chain.
        this.cache = Object.assign({}, this.cache, itemsObject);
        Storage.#deepFreeze(this.cache);
        resolve();
      });
    });
  }

  /**
   * Remove a property from storage
   * @param {string} key
   * @returns
   */
  async remove(key) {
    return new Promise((resolve, reject) => {
      this.storageArea.remove(key, () => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Pass the data retrieved from storage down the promise chain.

        this.cache = Object.assign({}, this.cache);
        delete this.cache[key];
        Storage.#deepFreeze(this.cache);
        resolve();
      });
    });
  }

  /**
   * Clear all properties in storage
   * @returns
   */
  async clear() {
    return new Promise((resolve, reject) => {
      this.storageArea.clear(() => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Pass the data retrieved from storage down the promise chain.
        this.cache = Storage.#deepFreeze({});
        resolve();
      });
    });
  }
}
