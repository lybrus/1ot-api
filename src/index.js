import auth, { refreshToken } from './auth'
import account from './account'
import getProfiles from './getProfiles'
import getAlerts from './getAlerts'
import { getSims, getSim, getAllSims, Sim } from './sims'
import EventEmitter from 'events'
import request from './request'

const TOKEN_EVENT = 'token'

class Connector extends EventEmitter {
    constructor({ accessToken, expiresIn, refreshToken } = {}) {
        super()

        if (accessToken && expiresIn && refreshToken) {
            this._setToken({ accessToken, expiresIn, refreshToken }, false)
        }
    }

    auth = auth
    account = account(this)
    getProfiles = getProfiles
    getSims = getSims
    getSim = getSim
    getAllSims = getAllSims
    getAlerts = getAlerts

    sim({ iccid, eid }) {
        return new Sim({ connector: this, iccid, eid })
    }

    _setToken({ accessToken, expiresIn, refreshToken }, emitEvent = true) {
        this.accessToken = accessToken
        this.expiresIn = expiresIn
        this.refreshToken = refreshToken

        this.authenticated = true

        if (emitEvent) {
            this.emit(TOKEN_EVENT, { accessToken, expiresIn, refreshToken })
        }
    }

    _refreshToken = refreshToken
    _request = request
}

export default Connector
export { primaryStatuses, secondaryStatuses } from './sims'
