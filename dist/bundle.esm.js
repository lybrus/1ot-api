import EventEmitter from 'events';
import http from 'http';
import https from 'https';
import url from 'url';
import crypto$1 from 'crypto';
import zlib from 'zlib';
import stream from 'stream';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

async function auth(username, password) {
  if (!(username && password)) {
    throw new Error('Username and password are required');
  }

  try {
    const response = await this._request({
      path: `/oauth/token`,
      method: 'POST',
      ignoreAuth: true,
      urlParams: {
        grant_type: 'password',
        client_id: username,
        username,
        password
      }
    });
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn
    } = response;

    this._setToken({
      accessToken,
      refreshToken,
      expiresIn: new Date(new Date().getTime() + expiresIn * 1000)
    });

    return true;
  } catch (e) {
    const {
      statusCode
    } = e;

    if (statusCode === 401) {
      return false;
    } else {
      throw e;
    }
  }
}
async function refreshToken() {
  if (!this.refreshToken) {
    throw new Error('Refresh token is missed');
  }

  const response = await this._request({
    path: `/oauth/token`,
    method: 'POST',
    ignoreAuth: true,
    urlParams: {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
    }
  });
  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn
  } = response;

  this._setToken({
    accessToken,
    refreshToken,
    expiresIn: new Date(new Date().getTime() + expiresIn * 1000)
  });
}

async function pause(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

const LIMIT = 1000;
async function getAllEntities(getter, key, params, limit = LIMIT) {
  let currentOffset = 0;
  const result = [];

  while (true) {
    const {
      [key]: entities,
      found
    } = await getter({ ...params,
      offset: currentOffset
    });
    result.push(...entities);

    if (found < limit) {
      break;
    }

    await pause(1000);
    currentOffset += limit;
  }

  return result;
}
function bindConnector(connector, object) {
  return Object.keys(object).reduce((prev, key) => ({ ...prev,
    [key]: object[key].bind(connector)
  }), {});
}
function assignIf(target, source) {
  return Object.assign(target, Object.keys(source).reduce((prev, key) => source[key] ? {
    [key]: source[key],
    ...prev
  } : prev, {}));
}
function monthYearObject(date) {
  return date ? {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  } : {};
}

async function getBalance({
  date
} = {}) {
  const {
    data_used: dataUsed,
    data_cost: dataCost,
    ...rest
  } = await this._request({
    path: `/get_account_balance`,
    urlParams: monthYearObject(date)
  });
  return {
    dataUsed,
    dataCost,
    ...rest
  };
}

async function getGroups() {
  const response = await this._request({
    path: `/get_account_groups`
  });
  return response;
}

var account = (connector => bindConnector(connector, {
  getBalance,
  getGroups
}));

async function getProfiles() {
  const response = await this._request({
    path: `/get_available_profiles`
  });
  return response;
}

async function getAlerts({
  offset = 0,
  onlyUnread = false,
  markAsRead = false,
  groupName
} = {}) {
  let requestParams;

  if (groupName) {
    requestParams = {
      path: `/get_group_alerts`,
      urlParams: {
        offset,
        only_unread: onlyUnread,
        mark_as_read: markAsRead,
        group: groupName
      }
    };
  } else {
    requestParams = {
      path: `/get_account_alerts`,
      urlParams: {
        offset,
        only_unread: onlyUnread,
        mark_as_read: markAsRead
      }
    };
  }

  const response = await this._request(requestParams);
  return response;
}

async function getSim({
  iccid,
  eid
}) {
  if (!(iccid || eid)) {
    throw new Error('iccid or eid are required');
  }

  const initParams = {
    connector: this
  };
  assignIf(initParams, {
    iccid,
    eid
  });
  const sim = new Sim(initParams);
  await sim.load();
  return sim;
}

async function getSims({
  offset = 0,
  iccid,
  eid,
  groupName
} = {}) {
  let requestParams;

  if (iccid) {
    requestParams = {
      path: `/get_sims`,
      urlParams: {
        offset,
        iccid
      }
    };
  } else if (eid) {
    requestParams = {
      path: `/get_sims`,
      urlParams: {
        offset,
        eid
      }
    };
  } else if (groupName) {
    requestParams = {
      path: `/get_group_sims`,
      urlParams: {
        offset,
        group: groupName
      }
    };
  } else {
    requestParams = {
      path: `/get_account_sims`,
      urlParams: {
        offset
      }
    };
  }

  const response = await this._request(requestParams);
  const {
    sims,
    ...rest
  } = response;
  return {
    sims: sims.map(sim => new Sim({
      connector: this,
      simData: sim
    })),
    ...rest
  };
}

async function getSessions({
  offset = 0,
  from,
  to
} = {}) {
  const {
    connector
  } = this;
  const urlParams = {
    offset
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid,
    from,
    to
  });
  const {
    sessions,
    from: fromResponse,
    to: toResponse,
    ...restResponse
  } = await connector._request({
    path: '/get_sim_sessions',
    urlParams
  });
  return {
    sessions: sessions.map(({
      data_size: dataSize,
      start_time: startTime,
      data_cost: dataCost,
      ...rest
    }) => ({
      dataSize,
      startTime: new Date(startTime),
      dataCost,
      ...rest
    })),
    from: new Date(fromResponse),
    to: new Date(toResponse),
    ...restResponse
  };
}

async function getCost({
  date
} = {}) {
  const {
    connector
  } = this;
  const urlParams = monthYearObject(date);
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const {
    data_plan: dataPlan,
    data_used: dataUsed,
    data_cost: dataCost,
    ...rest
  } = await connector._request({
    path: '/get_sim_cost',
    urlParams
  });
  return {
    dataPlan,
    dataUsed,
    dataCost,
    ...rest
  };
}

async function getAlerts$1({
  offset = 0,
  onlyUnread = false,
  markAsRead = false
} = {}) {
  const {
    connector
  } = this;
  const urlParams = {
    offset,
    only_unread: onlyUnread,
    mark_as_read: markAsRead
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: `/get_sim_alerts`,
    urlParams
  });
  return response;
}

async function diagnostics() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/diagnostics',
    urlParams
  });
  return response;
}

async function setName(name) {
  if (!name) {
    throw new Error('Name is required');
  }

  const {
    connector
  } = this;
  const urlParams = {
    name
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/set_name',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function setGroup(groupName) {
  if (!groupName) {
    throw new Error('Group name is required');
  }

  const {
    connector
  } = this;
  const urlParams = {
    group: groupName
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/set_group',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function resume() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/suspend',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function resume$1() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/resume',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function test() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/test',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function resume$2() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/close',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function reset() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/reset',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function sendSms(sms) {
  if (!sms) {
    throw new Error('sms is required');
  }

  const {
    connector
  } = this;
  const urlParams = {
    sms
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/sendSms',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function setGroup$1(dataLimit) {
  if (!dataLimit) {
    throw new Error('Data limit is required');
  }

  const {
    connector
  } = this;
  const urlParams = {
    limit: dataLimit
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/set_data_limit',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function esimProfile({
  profile,
  action
}) {
  if (!(profile && action)) {
    throw new Error('Profile and action are required');
  }

  const {
    connector
  } = this;
  const urlParams = {
    profile,
    action
  };
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/esim_profile',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function activate() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/activate',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

async function deactivate() {
  const {
    connector
  } = this;
  const urlParams = {};
  const {
    iccid,
    eid
  } = this;
  assignIf(urlParams, {
    iccid,
    eid
  });
  const response = await connector._request({
    path: '/deactivate',
    method: 'PUT',
    urlParams
  });
  this.update(response);
  return this;
}

class Sim {
  constructor({
    connector,
    simData,
    iccid,
    eid
  }) {
    _defineProperty(this, "getSessions", getSessions);

    _defineProperty(this, "getCost", getCost);

    _defineProperty(this, "getAlerts", getAlerts$1);

    _defineProperty(this, "diagnostics", diagnostics);

    _defineProperty(this, "setName", setName);

    _defineProperty(this, "setGroup", setGroup);

    _defineProperty(this, "suspend", resume);

    _defineProperty(this, "resume", resume$1);

    _defineProperty(this, "test", test);

    _defineProperty(this, "close", resume$2);

    _defineProperty(this, "reset", reset);

    _defineProperty(this, "sendSms", sendSms);

    _defineProperty(this, "setDataLimit", setGroup$1);

    _defineProperty(this, "esimProfile", esimProfile);

    _defineProperty(this, "activate", activate);

    _defineProperty(this, "deactivate", deactivate);

    this.loaded = false;

    if (simData) {
      this.update(simData);
    } else if (iccid) {
      this.iccid = iccid;
    } else if (eid) {
      this.eid = eid;
    } else {
      throw new Error('simData, iccid or eid are required');
    }

    this.connector = connector;
  }

  update(simData) {
    const {
      data_limit: dataLimit,
      ...rest
    } = simData;
    Object.assign(this, {
      dataLimit,
      ...rest
    });
    this.loaded = true;
  }

  async load() {
    const {
      iccid,
      eid,
      connector
    } = this;
    const urlParams = {};
    assignIf(urlParams, {
      iccid,
      eid
    });
    const simData = await connector._request({
      path: '/get_sim',
      urlParams
    });
    this.update(simData);
    return this;
  }

}

let _Symbol$iterator;
_Symbol$iterator = Symbol.iterator;

class Sims {
  constructor({
    connector,
    sims,
    simsData,
    iccids,
    eids
  }) {
    _defineProperty(this, "doForAll", action => async (...params) => {
      const result = [];
      const {
        entities
      } = this;

      for (const sim of entities) {
        try {
          result.push((await sim[action](...params)));
        } catch (e) {
          result.push(e);
        }
      }

      return result;
    });

    _defineProperty(this, "load", this.doForAll('load'));

    _defineProperty(this, "getSessions", this.doForAll('getSessions'));

    _defineProperty(this, "getCost", this.doForAll('getCost'));

    _defineProperty(this, "getAlerts", this.doForAll('getAlerts'));

    _defineProperty(this, "diagnostics", this.doForAll('diagnostics'));

    _defineProperty(this, "setName", this.doForAll('setName'));

    _defineProperty(this, "setGroup", this.doForAll('setGroup'));

    _defineProperty(this, "suspend", this.doForAll('suspend'));

    _defineProperty(this, "resume", this.doForAll('resume'));

    _defineProperty(this, "test", this.doForAll('test'));

    _defineProperty(this, "close", this.doForAll('close'));

    _defineProperty(this, "reset", this.doForAll('reset'));

    _defineProperty(this, "sendSms", this.doForAll('sendSms'));

    _defineProperty(this, "setDataLimit", this.doForAll('setDataLimit'));

    _defineProperty(this, "esimProfile", this.doForAll('esimProfile'));

    _defineProperty(this, "activate", this.doForAll('activate'));

    _defineProperty(this, "deactivate", this.doForAll('deactivate'));

    if (sims) {
      this.entities = sims;
    } else if (simsData) {
      this.entities = simsData.map(simData => new Sim({
        connector,
        simData
      }));
    } else if (iccids) {
      this.entities = iccids.map(iccid => new Sim({
        connector,
        iccid
      }));
    } else if (eids) {
      this.entities = eids.map(eid => new Sim({
        connector,
        eid
      }));
    } else {
      throw new Error('simsData, iccids or eids are required');
    }
  }

  get length() {
    return this.entities.length;
  }

  [_Symbol$iterator]() {
    return this.entities.values();
  }

}

async function getAllSims(filter) {
  const {
    iccid,
    eid,
    groupName
  } = filter;
  const rawSims = await getAllEntities(this.getSims.bind(this), 'sims', {
    iccid,
    eid,
    groupName
  });
  const sims = new Sims({
    connector: this,
    sims: rawSims
  });
  return sims;
}

const primaryStatuses = {
  ON: 'ON',
  OFF: 'OFF',
  PENDING: 'PENDING',
  DELETED: 'DELETED'
};
const secondaryStatuses = {
  LIVE: 'LIVE',
  SUSPENDED: 'SUSPENDED',
  TEST: 'TEST',
  OFF: 'OFF',
  DELETED: 'DELETED'
};

const isStream = stream =>
	stream !== null &&
	typeof stream === 'object' &&
	typeof stream.pipe === 'function';

isStream.writable = stream =>
	isStream(stream) &&
	stream.writable !== false &&
	typeof stream._write === 'function' &&
	typeof stream._writableState === 'object';

isStream.readable = stream =>
	isStream(stream) &&
	stream.readable !== false &&
	typeof stream._read === 'function' &&
	typeof stream._readableState === 'object';

isStream.duplex = stream =>
	isStream.writable(stream) &&
	isStream.readable(stream);

isStream.transform = stream =>
	isStream.duplex(stream) &&
	typeof stream._transform === 'function' &&
	typeof stream._transformState === 'object';

var isStream_1 = isStream;

function Caseless (dict) {
  this.dict = dict || {};
}
Caseless.prototype.set = function (name, value, clobber) {
  if (typeof name === 'object') {
    for (var i in name) {
      this.set(i, name[i], value);
    }
  } else {
    if (typeof clobber === 'undefined') clobber = true;
    var has = this.has(name);

    if (!clobber && has) this.dict[has] = this.dict[has] + ',' + value;
    else this.dict[has || name] = value;
    return has
  }
};
Caseless.prototype.has = function (name) {
  var keys = Object.keys(this.dict)
    , name = name.toLowerCase()
    ;
  for (var i=0;i<keys.length;i++) {
    if (keys[i].toLowerCase() === name) return keys[i]
  }
  return false
};
Caseless.prototype.get = function (name) {
  name = name.toLowerCase();
  var result, _key;
  var headers = this.dict;
  Object.keys(headers).forEach(function (key) {
    _key = key.toLowerCase();
    if (name === _key) result = headers[key];
  });
  return result
};
Caseless.prototype.swap = function (name) {
  var has = this.has(name);
  if (has === name) return
  if (!has) throw new Error('There is no header than matches "'+name+'"')
  this.dict[name] = this.dict[has];
  delete this.dict[has];
};
Caseless.prototype.del = function (name) {
  var has = this.has(name);
  return delete this.dict[has || name]
};

var caseless = function (dict) {return new Caseless(dict)};
var httpify = function (resp, headers) {
  var c = new Caseless(headers);
  resp.setHeader = function (key, value, clobber) {
    if (typeof value === 'undefined') return
    return c.set(key, value, clobber)
  };
  resp.hasHeader = function (key) {
    return c.has(key)
  };
  resp.getHeader = function (key) {
    return c.get(key)
  };
  resp.removeHeader = function (key) {
    return c.del(key)
  };
  resp.headers = c.dict;
  return c
};
caseless.httpify = httpify;

const length = (a, b) => {
  if (a.byteLength === b.byteLength) return a.byteLength
  else if (a.byteLength > b.byteLength) return a.byteLength
  return b.byteLength
};

const bytes = (_from, encoding) => bytes.from(_from, encoding);

bytes.sorter = (a, b) => {
  a = bytes(a);
  b = bytes(b);
  const len = length(a, b);
  let i = 0;
  while (i < (len - 1)) {
    if (i >= a.byteLength) return 1
    else if (i >= b.byteLength) return -1

    if (a.getUint8(i) < b.getUint8(i)) return -1
    else if (a.getUint8(i) > b.getUint8(i)) return 1
    i++;
  }
  return 0
};

bytes.compare = (a, b) => !bytes.sorter(a, b);
bytes.memcopy = (_from, encoding) => {
  const b = bytes(_from, encoding);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
};
bytes.arrayBuffer = (_from, encoding) => {
  _from = bytes(_from, encoding);
  if (_from.buffer.byteLength === _from.byteLength) return _from.buffer
  return _from.buffer.slice(_from.byteOffset, _from.byteOffset + _from.byteLength)
};
const sliceOptions = (_from, start = 0, end = null) => {
  _from = bytes(_from);
  end = (end === null ? _from.byteLength : end) - start;
  return [_from.buffer, _from.byteOffset + start, end]
};
bytes.slice = (_from, start, end) => new DataView(...sliceOptions(_from, start, end));

bytes.memcopySlice = (_from, start, end) => {
  const [buffer, offset, length] = sliceOptions(_from, start, end);
  return buffer.slice(offset, length + offset)
};
bytes.typedArray = (_from, _Class = Uint8Array) => {
  _from = bytes(_from);
  return new _Class(_from.buffer, _from.byteOffset, _from.byteLength / _Class.BYTES_PER_ELEMENT)
};

bytes.concat = (_from) => {
  _from = Array.from(_from);
  _from = _from.map(b => bytes(b));
  const length = _from.reduce((x, y) => x + y.byteLength, 0);
  const ret = new Uint8Array(length);
  let i = 0;
  for (const part of _from) {
    const view = bytes.typedArray(part);
    ret.set(view, i);
    i += view.byteLength;
  }
  return ret.buffer
};

const maxEntropy = 65536;

bytes.random = length => {
  const ab = new ArrayBuffer(length);
  if (length > maxEntropy) {
    let i = 0;
    while (i < ab.byteLength) {
      let len;
      if (i + maxEntropy > ab.byteLength) len = ab.byteLength - i;
      else len = maxEntropy;
      const view = new Uint8Array(ab, i, len);
      i += maxEntropy;
      bytes._randomFill(view);
    }
  } else {
    const view = new Uint8Array(ab);
    bytes._randomFill(view);
  }
  return ab
};

var core = bytes;

core.from = (_from, _encoding) => {
  if (_from instanceof DataView) return _from
  if (_from instanceof ArrayBuffer) return new DataView(_from)
  let buffer;
  if (typeof _from === 'string') {
    if (!_encoding) {
      _encoding = 'utf-8';
    } else if (_encoding === 'base64') {
      buffer = Uint8Array.from(atob(_from), c => c.charCodeAt(0)).buffer;
      return new DataView(buffer)
    }
    if (_encoding !== 'utf-8') throw new Error('Browser support for encodings other than utf-8 not implemented')
    return new DataView((new TextEncoder()).encode(_from).buffer)
  } else if (typeof _from === 'object') {
    if (ArrayBuffer.isView(_from)) {
      if (_from.byteLength === _from.buffer.byteLength) return new DataView(_from.buffer)
      else return new DataView(_from.buffer, _from.byteOffset, _from.byteLength)
    }
  }
  throw new Error('Unkown type. Cannot convert to ArrayBuffer')
};

core.toString = (_from, encoding) => {
  _from = core(_from, encoding);
  const uint = new Uint8Array(_from.buffer, _from.byteOffset, _from.byteLength);
  const str = String.fromCharCode(...uint);
  if (encoding === 'base64') {
    /* would be nice to find a way to do this directly from a buffer
     * instead of doing two string conversions
     */
    return btoa(str)
  } else {
    return str
  }
};

core.native = (_from, encoding) => {
  if (_from instanceof Uint8Array) return _from
  _from = core.from(_from, encoding);
  return new Uint8Array(_from.buffer, _from.byteOffset, _from.byteLength)
};

if (process.browser) core._randomFill = (...args) => crypto.getRandomValues(...args);

var browser = core;

const fallback = browser.from;


core.from = (_from, encoding) => {
  if (_from instanceof DataView) return _from
  if (_from instanceof ArrayBuffer) return new DataView(_from)
  if (typeof _from === 'string') {
    _from = Buffer.from(_from, encoding);
  }
  if (Buffer.isBuffer(_from)) {
    return new DataView(_from.buffer, _from.byteOffset, _from.byteLength)
  }
  return fallback(_from, encoding)
};
core.toString = (_from, encoding) => {
  _from = core(_from);
  return Buffer.from(_from.buffer, _from.byteOffset, _from.byteLength).toString(encoding)
};

core.native = (_from, encoding) => {
  if (Buffer.isBuffer(_from)) return _from
  _from = core(_from, encoding);
  return Buffer.from(_from.buffer, _from.byteOffset, _from.byteLength)
};

core._randomFill = crypto$1.randomFillSync;

var node = core;

const encodings = new Set(['json', 'buffer', 'string']);

var core$1 = mkrequest => (...args) => {
  const statusCodes = new Set();
  let method;
  let encoding;
  let headers;
  let baseurl = '';

  args.forEach(arg => {
    if (typeof arg === 'string') {
      if (arg.toUpperCase() === arg) {
        if (method) {
          const msg = `Can't set method to ${arg}, already set to ${method}.`;
          throw new Error(msg)
        } else {
          method = arg;
        }
      } else if (arg.startsWith('http:') || arg.startsWith('https:')) {
        baseurl = arg;
      } else {
        if (encodings.has(arg)) {
          encoding = arg;
        } else {
          throw new Error(`Unknown encoding, ${arg}`)
        }
      }
    } else if (typeof arg === 'number') {
      statusCodes.add(arg);
    } else if (typeof arg === 'object') {
      if (headers) {
        throw new Error('Cannot set headers twice.')
      }
      headers = arg;
    } else {
      throw new Error(`Unknown type: ${typeof arg}`)
    }
  });

  if (!method) method = 'GET';
  if (statusCodes.size === 0) {
    statusCodes.add(200);
  }

  return mkrequest(statusCodes, method, encoding, headers, baseurl)
};

const { URL } = url;





const { PassThrough } = stream;

const compression = {};

/* istanbul ignore else */
if (zlib.createBrotliDecompress) compression.br = () => zlib.createBrotliDecompress();
/* istanbul ignore else */
if (zlib.createGunzip) compression.gzip = () => zlib.createGunzip();
/* istanbul ignore else */
if (zlib.createInflate) compression.deflate = () => zlib.createInflate();

const acceptEncoding = Object.keys(compression).join(', ');

const getResponse = resp => {
  const ret = new PassThrough();
  ret.statusCode = resp.statusCode;
  ret.statusMessage = resp.statusMessage;
  ret.headers = resp.headers;
  ret._response = resp;
  if (ret.headers['content-encoding']) {
    const encodings = ret.headers['content-encoding'].split(', ').reverse();
    while (encodings.length) {
      const enc = encodings.shift();
      if (compression[enc]) {
        resp = resp.pipe(compression[enc]());
      } else {
        break
      }
    }
  }
  return resp.pipe(ret)
};

class StatusError extends Error {
  constructor (res, ...params) {
    super(...params);

    Error.captureStackTrace(this, StatusError);
    this.message = `Incorrect statusCode: ${res.statusCode}`;
    this.statusCode = res.statusCode;
    this.responseBody = new Promise((resolve) => {
      const buffers = [];
      res.on('data', chunk => buffers.push(chunk));
      res.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }
}

const getBuffer = stream => new Promise((resolve, reject) => {
  const parts = [];
  stream.on('error', reject);
  stream.on('end', () => resolve(Buffer.concat(parts)));
  stream.on('data', d => parts.push(d));
});

const mkrequest = (statusCodes, method, encoding, headers, baseurl) => (_url, body = null, _headers = {}) => {
  _url = baseurl + (_url || '');
  const parsed = new URL(_url);
  let h;
  if (parsed.protocol === 'https:') {
    h = https;
  } else if (parsed.protocol === 'http:') {
    h = http;
  } else {
    throw new Error(`Unknown protocol, ${parsed.protocol}`)
  }
  const request = {
    path: parsed.pathname + parsed.search,
    port: parsed.port,
    method: method,
    headers: { ...(headers || {}), ..._headers },
    hostname: parsed.hostname
  };
  if (parsed.username || parsed.password) {
    request.auth = [parsed.username, parsed.password].join(':');
  }
  const c = caseless(request.headers);
  if (encoding === 'json') {
    if (!c.get('accept')) {
      c.set('accept', 'application/json');
    }
  }
  if (!c.has('accept-encoding')) {
    c.set('accept-encoding', acceptEncoding);
  }
  return new Promise((resolve, reject) => {
    const req = h.request(request, async res => {
      res.status = res.statusCode;
      if (!statusCodes.has(res.statusCode)) {
        return reject(new StatusError(res))
      }
      res = getResponse(res);

      if (!encoding) return resolve(res)
      else {
        const buff = await getBuffer(res);
        /* istanbul ignore else */
        if (encoding === 'buffer') {
          resolve(buff);
        } else if (encoding === 'json') {
          let ret;
          try {
            ret = JSON.parse(buff.toString());
            resolve(ret);
          } catch (e) {
            e.message += `str"${buff.toString()}"`;
            reject(e);
          }
        } else if (encoding === 'string') {
          resolve(buff.toString());
        }
      }
    });
    req.on('error', reject);
    if (body) {
      if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
        body = node.native(body);
      }
      if (Buffer.isBuffer(body)) ; else if (typeof body === 'string') {
        body = Buffer.from(body);
      } else if (isStream_1(body)) {
        body.pipe(req);
        body = null;
      } else if (typeof body === 'object') {
        if (!c.has('content-type')) {
          req.setHeader('content-type', 'application/json');
        }
        body = Buffer.from(JSON.stringify(body));
      } else {
        reject(new Error('Unknown body type.'));
      }
      if (body) {
        req.setHeader('content-length', body.length);
        req.end(body);
      }
    } else {
      req.end();
    }
  })
};

var nodejs = core$1(mkrequest);

const baseUrl = 'https://api.1ot.mobi/v1';
async function request({
  path,
  method = 'GET',
  data,
  ignoreAuth = false,
  urlParams = {}
}) {
  const {
    expiresIn
  } = this;

  if (!ignoreAuth) {
    if (!this.authenticated) {
      throw new Error('not auth');
    }

    if (expiresIn < new Date()) {
      await this._refreshToken();
    }
  }

  const {
    accessToken
  } = this;
  const urlParamsString = Object.keys(urlParams).map(key => urlParams[key] instanceof Array ? urlParams[key].map(value => `${key}=${value}`).join('&') : `${key}=${urlParams[key]}`).join('&');
  const fullPath = `${path}${urlParamsString ? '?' : ''}${urlParamsString}`;
  const headers = {
    'Content-type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`
  };
  const requestParams = method.toUpperCase() === 'GET' ? [fullPath] : data ? [fullPath, data] : [fullPath];
  const response = await nodejs(baseUrl, method.toUpperCase(), 'json', headers, 200, 202)(...requestParams);
  return response;
}

const TOKEN_EVENT = 'token';

class Connector extends EventEmitter {
  constructor({
    accessToken,
    expiresIn,
    refreshToken: _refreshToken
  } = {}) {
    super();

    _defineProperty(this, "auth", auth);

    _defineProperty(this, "account", account(this));

    _defineProperty(this, "getProfiles", getProfiles);

    _defineProperty(this, "getSims", getSims);

    _defineProperty(this, "getSim", getSim);

    _defineProperty(this, "getAllSims", getAllSims);

    _defineProperty(this, "getAlerts", getAlerts);

    _defineProperty(this, "_refreshToken", refreshToken);

    _defineProperty(this, "_request", request);

    if (accessToken && expiresIn && _refreshToken) {
      this._setToken({
        accessToken,
        expiresIn,
        refreshToken: _refreshToken
      }, false);
    }
  }

  sim({
    iccid,
    eid
  }) {
    return new Sim({
      connector: this,
      iccid,
      eid
    });
  }

  _setToken({
    accessToken,
    expiresIn,
    refreshToken
  }, emitEvent = true) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.refreshToken = refreshToken;
    this.authenticated = true;

    if (emitEvent) {
      this.emit(TOKEN_EVENT, {
        accessToken,
        expiresIn,
        refreshToken
      });
    }
  }

}

export default Connector;
export { primaryStatuses, secondaryStatuses };
