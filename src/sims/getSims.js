import { Sim } from '.'

export default async function getSims({ offset = 0, iccid, eid, groupName } = {}) {
    let requestParams

    if (iccid) {
        requestParams = {
            path: `/get_sims`,
            urlParams: { offset, iccid }
        }
    } else if (eid) {
        requestParams = {
            path: `/get_sims`,
            urlParams: { offset, eid }
        }
    } else if (groupName) {
        requestParams = {
            path: `/get_group_sims`,
            urlParams: { offset, group: groupName }
        }
    } else {
        requestParams = {
            path: `/get_account_sims`,
            urlParams: { offset }
        }
    }

    const response = await this._request(requestParams)

    const { sims, ...rest } = response

    return {
        sims: sims.map((sim) => new Sim({ connector: this, simData: sim })),
        ...rest
    }
}
