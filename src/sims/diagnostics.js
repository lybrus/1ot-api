import { assignIf } from '../utils'

export default async function diagnostics() {
    const { connector } = this
    const urlParams = {}

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/diagnostics',
        urlParams
    })

    return response
}
