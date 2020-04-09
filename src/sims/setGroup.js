import { assignIf } from '../utils'

export default async function setGroup(groupName) {
    if (!groupName) {
        throw new Error('Group name is required')
    }

    const { connector } = this
    const urlParams = { group: groupName }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/set_group',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
