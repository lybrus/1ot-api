export default async function getGroups() {
    const response = await this._request({
        path: `/get_account_groups`
    })

    return response
}
