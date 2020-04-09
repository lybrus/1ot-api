import getSessions from './getSessions'
import getCost from './getCost'
import getAlerts from './getAlerts'
import diagnostics from './diagnostics'
import setName from './setName'
import setGroup from './setGroup'
import suspend from './suspend'
import resume from './resume'
import test from './testRequest'
import close from './close'
import reset from './reset'
import sendSms from './sendSms'
import setDataLimit from './setDataLimit'
import esimProfile from './esimProfile'
import activate from './activate'
import deactivate from './deactivate'
import { assignIf } from '../utils'

class Sim {
    constructor({ connector, simData, iccid, eid }) {
        this.loaded = false

        if (simData) {
            this.update(simData)
        } else if (iccid) {
            this.iccid = iccid
        } else if (eid) {
            this.eid = eid
        } else {
            throw new Error('simData, iccid or eid are required')
        }

        this.connector = connector
    }

    update(simData) {
        const { data_limit: dataLimit, ...rest } = simData
        Object.assign(this, { dataLimit, ...rest })

        this.loaded = true
    }

    async load() {
        const { iccid, eid, connector } = this
        const urlParams = {}
        assignIf(urlParams, { iccid, eid })

        const simData = await connector._request({
            path: '/get_sim',
            urlParams
        })

        this.update(simData)

        return this
    }

    getSessions = getSessions
    getCost = getCost
    getAlerts = getAlerts
    diagnostics = diagnostics
    setName = setName
    setGroup = setGroup
    suspend = suspend
    resume = resume
    test = test
    close = close
    reset = reset
    sendSms = sendSms
    setDataLimit = setDataLimit
    esimProfile = esimProfile
    activate = activate
    deactivate = deactivate
}

export default Sim
