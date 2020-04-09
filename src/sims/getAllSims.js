import { getAllEntities } from '../utils'
import Sims from './Sims'

export default async function getAllSims(filter) {
    const { iccid, eid, groupName } = filter
    const rawSims = await getAllEntities(this.getSims.bind(this), 'sims', { iccid, eid, groupName })

    const sims = new Sims({ connector: this, sims: rawSims })

    return sims
}
