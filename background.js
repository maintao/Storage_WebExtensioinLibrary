import Storage from "./lib/storage.js";

/**
 * Set a value in storage, then get it.
 */
const testCase1 = async (storage) => {
  console.log("--- testCase1");
  await storage.clear();
  await storage.set({
    key: 1,
  });
  const value = await storage.get("key");
  console.assert(value === 1, "testCase1 fail", value);
};

/**
 * Remove key, then get empty
 */
const testCase2 = async (storage) => {
  console.log("--- testCase2");
  await storage.clear();
  await storage.set({
    key: 1,
  });
  await storage.remove("key");
  const value = await storage.get("key");
  console.assert(value === undefined, "testCase2 fail", value);
};

/**
 * set 3 keys, then get all
 */
const testCase3 = async (storage) => {
  console.log("--- testCase3");
  await storage.clear();
  await storage.set({
    key1: 1,
    key2: 2,
  });
  await storage.set({
    key1: 1, // duplicated key on purpose
    key3: 3,
  });
  let value = await storage.getAll();
  let expectObj = { key1: 1, key2: 2, key3: 3 };
  console.assert(JSON.stringify(value) === JSON.stringify(expectObj), "testCase3 fail", value);
};

/**
 * Don't allow modifying directly
 */
const testCase4 = async (storage) => {
  console.log("--- testCase4");
  await storage.clear();
  await storage.set({
    key1: { a: 1 },
  });
  let value = await storage.get("key1");

  try {
    value.a = 2; // changing is not allowed
    console.assert(false, "testCase4 fail", "never should reach here");
  } catch (error) {
    console.log("not allow changing", error);
  }
  try {
    value.b = 1; // adding is not allowed
    console.assert(false, "testCase4 fail", "never should reach here");
  } catch (error) {
    console.log("not allow adding", error);
  }
  try {
    delete value.a; // deleting is not allowed
    console.assert(false, "testCase4 fail", "never should reach here");
  } catch (error) {
    console.log("not allow deleting", error);
  }
};

const runTest = async (storage) => {
  await testCase1(storage);
  await testCase2(storage);
  await testCase3(storage);
  await testCase4(storage);
};

(async () => {
  let storageSync = new Storage(chrome.storage.sync);
  let storageLocal = new Storage(chrome.storage.local);
  await runTest(storageSync);
  await runTest(storageLocal);
})();
