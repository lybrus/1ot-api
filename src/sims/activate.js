import { assignIf } from '../utils'

export default async function activate() {
    const { connector } = this
    const urlParams = {}

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/activate',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
