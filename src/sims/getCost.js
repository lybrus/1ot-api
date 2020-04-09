import { assignIf, monthYearObject } from '../utils'

export default async function getCost({ date } = {}) {
    const { connector } = this
    const urlParams = monthYearObject(date)

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const { data_plan: dataPlan, data_used: dataUsed, data_cost: dataCost, ...rest } = await connector._request({
        path: '/get_sim_cost',
        urlParams
    })

    return { dataPlan, dataUsed, dataCost, ...rest }
}
