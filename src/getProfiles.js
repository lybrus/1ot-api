export default async function getProfiles() {
    const response = await this._request({
        path: `/get_available_profiles`
    })

    return response
}
