export class CachedValue {

  constructor(key, db) {
    this.key = key;
    this.value = this.resolve(db);
  }
  
  async _resolve() {
    this.lastUsed = new Date();
    return await this.value;
  }
}

class CahedValueArray {

  constructor(type, shelfLife = 24, refineInterval = 24) {
    this.type = type;
    this.values = [];
    this.shelfLife = shelfLife*60*60*1000;
    this.refineValues = this.refineValues.bind(this);
    this.refiningInterval = setInterval(this.refineValues, refineInterval*60*60*1000);
  }

  destroyRefining() {
    clearInterval(this.refiningInterval);
  }

  refineValues() {
    const nowDate = new Date();
    for (const index in this.values) {
      if (nowDate - this.values[index].lastUsed >= this.shelfLife)
        this.values.splice(index, 1);
    }
  }

  findLocal(key) {
    return this.values.find(v => v.key === key);
  }

  async find(key, db, forceFetch = true) {

    let value = this.findLocal(key);

    if (!forceFetch) return value;

    let index;

    if (value === undefined) {
      value = new this.type(key, db);
      index = this.values.push(value) - 1;
    }

    try {

      const _value = await value?._resolve();
      if (_value === undefined) this.values.splice(index, 1);
      return _value;

    } catch (error) {

      this.values.splice(index, 1);
      throw error;

    }
  }
}

export class Cache {

  static _valuesArray = [];

  static createCachedValues(name, type, shelfLife, refineInterval) {
    Cache._valuesArray[name] = new CahedValueArray(type, shelfLife, refineInterval);
  }

  static findLocal(name, key) {
    return Cache._valuesArray[name].findLocal(key);
  }

  static async find(name, key, db) {
    return await Cache._valuesArray[name].find(key, db);
  }

}

// function _timeout(callback, ms) {

//   return new Promise((resolve, reject) => {
//     try {
//       callback();
//       resolve();
//     } catch (error) {
//       reject(error);
//     }
//   }, ms);
// }

// class Test extends CachedValue {

//   async resolve() {
//     let value;
//     await _timeout(() => {
//       //throw Error('Test error');
//       if (this.key === 5) value = { thisKey: this.key };
//     }, 1000);
//     return value;
//   }
// }

// let tests = new CahedValueArray(Test, 5, 3);

// async function _test() {
//   try {
//     const value = await tests.find(5);
//     console.log(value);
//     console.log(tests);
//   } catch (error) {
//     console.log('Error message:', error.message);
//     console.log(tests);
//   }
//   setInterval(() => console.log(tests), 3*1000);
//   setInterval(() => { tests.destroyRefining(); }, 7*1000);
//   //process.exit();
// }

// _test();