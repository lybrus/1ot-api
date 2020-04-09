import { assignIf } from '../utils'

export default async function setGroup(dataLimit) {
    if (!dataLimit) {
        throw new Error('Data limit is required')
    }

    const { connector } = this
    const urlParams = { limit: dataLimit }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/set_data_limit',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
