import { assignIf } from '../utils'

export default async function getAlerts({ offset = 0, onlyUnread = false, markAsRead = false } = {}) {
    const { connector } = this
    const urlParams = { offset, only_unread: onlyUnread, mark_as_read: markAsRead }

    const { iccid, eid } = this

    assignIf(urlParams, { iccid, eid })

    const response = await connector._request({
        path: `/get_sim_alerts`,
        urlParams
    })

    return response
}
