export default class CachedValue {

  constructor(db) {
    this.lastUsed = new Date();

    this._promise = new Promise(resolve => {
      this._resolve = resolve;
    });

    const obtain = async () => {
      await this._obtain(db);
      this._resolve(this);
    };
    obtain();
  }
  
  async obtain() {
    this.lastUsed = new Date();
    return await this._promise;
  }
}