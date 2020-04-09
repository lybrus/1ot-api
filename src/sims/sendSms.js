import { assignIf } from '../utils'

export default async function sendSms(sms) {
    if (!sms) {
        throw new Error('sms is required')
    }

    const { connector } = this
    const urlParams = { sms }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: '/sendSms',
        method: 'PUT',
        urlParams
    })

    this.update(response)

    return this
}
