import { assignIf } from '../utils'

export default async function setName(name) {
    if (!name) {
        throw new Error('Name is required')
    }

    const { connector } = this
    const urlParams = { name }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/set_name',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
