export default async function getAlerts({ offset = 0, onlyUnread = false, markAsRead = false, groupName } = {}) {
    let requestParams

    if (groupName) {
        requestParams = {
            path: `/get_group_alerts`,
            urlParams: { offset, only_unread: onlyUnread, mark_as_read: markAsRead, group: groupName }
        }
    } else {
        requestParams = {
            path: `/get_account_alerts`,
            urlParams: { offset, only_unread: onlyUnread, mark_as_read: markAsRead }
        }
    }

    const response = await this._request(requestParams)

    return response
}
