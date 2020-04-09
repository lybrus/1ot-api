import { assignIf } from '../utils'

export default async function reset() {
    const { connector } = this
    const urlParams = {}

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/reset',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
