import Sim from './Sim'

class Sims {
    constructor({ connector, sims, simsData, iccids, eids }) {
        if (sims) {
            this.entities = sims
        } else if (simsData) {
            this.entities = simsData.map((simData) => new Sim({ connector, simData }))
        } else if (iccids) {
            this.entities = iccids.map((iccid) => new Sim({ connector, iccid }))
        } else if (eids) {
            this.entities = eids.map((eid) => new Sim({ connector, eid }))
        } else {
            throw new Error('simsData, iccids or eids are required')
        }
    }

    doForAll = (action) => async (...params) => {
        const result = []
        const { entities } = this
        for (const sim of entities) {
            try {
                result.push(await sim[action](...params))
            } catch (e) {
                result.push(e)
            }
        }
        return result
    }

    load = this.doForAll('load')
    getSessions = this.doForAll('getSessions')
    getCost = this.doForAll('getCost')
    getAlerts = this.doForAll('getAlerts')
    diagnostics = this.doForAll('diagnostics')
    setName = this.doForAll('setName')
    setGroup = this.doForAll('setGroup')
    suspend = this.doForAll('suspend')
    resume = this.doForAll('resume')
    test = this.doForAll('test')
    close = this.doForAll('close')
    reset = this.doForAll('reset')
    sendSms = this.doForAll('sendSms')
    setDataLimit = this.doForAll('setDataLimit')
    esimProfile = this.doForAll('esimProfile')
    activate = this.doForAll('activate')
    deactivate = this.doForAll('deactivate')

    get length() {
        return this.entities.length
    }

    [Symbol.iterator]() {
        return this.entities.values()
    }
}

export default Sims
