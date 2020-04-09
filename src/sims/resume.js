import { assignIf } from '../utils'

export default async function resume() {
    const { connector } = this
    const urlParams = {}

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/resume',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
