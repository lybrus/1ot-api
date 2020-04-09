import { assignIf } from '../utils'

export default async function esimProfile({ profile, action }) {
    if (!(profile && action)) {
        throw new Error('Profile and action are required')
    }

    const { connector } = this
    const urlParams = { profile, action }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/esim_profile',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
