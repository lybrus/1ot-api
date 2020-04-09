import { assignIf } from '../utils'

export default async function getSessions({ offset = 0, from, to } = {}) {
    const { connector } = this
    const urlParams = { offset }
    const { iccid, eid } = this

    assignIf(urlParams, {
        iccid,
        eid,
        from,
        to
    })

    const { sessions, from: fromResponse, to: toResponse, ...restResponse } = await connector._request({
        path: '/get_sim_sessions',
        urlParams
    })

    return {
        sessions: sessions.map(({ data_size: dataSize, start_time: startTime, data_cost: dataCost, ...rest }) => ({
            dataSize,
            startTime: new Date(startTime),
            dataCost,
            ...rest
        })),
        from: new Date(fromResponse),
        to: new Date(toResponse),
        ...restResponse
    }
}
