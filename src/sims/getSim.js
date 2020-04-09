import { Sim } from '.'
import { assignIf } from '../utils'

export default async function getSim({ iccid, eid }) {
    if (!(iccid || eid)) {
        throw new Error('iccid or eid are required')
    }

    const initParams = { connector: this }
    assignIf(initParams, { iccid, eid })

    const sim = new Sim(initParams)
    await sim.load()

    return sim
}
