import { assignIf } from '../utils'

export default async function test() {
    const { connector } = this
    const urlParams = {}

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/test',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
