export default async function auth(username, password) {
    if (!(username && password)) {
        throw new Error('Username and password are required')
    }

    try {
        const response = await this._request({
            path: `/oauth/token`,
            method: 'POST',
            ignoreAuth: true,
            urlParams: {
                grant_type: 'password',
                client_id: username,
                username,
                password
            }
        })

        const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = response

        this._setToken({
            accessToken,
            refreshToken,
            expiresIn: new Date(new Date().getTime() + expiresIn * 1000)
        })

        return true
    } catch (e) {
        const { statusCode } = e

        if (statusCode === 401) {
            return false
        } else {
            throw e
        }
    }
}

export async function refreshToken() {
    if (!this.refreshToken) {
        throw new Error('Refresh token is missed')
    }

    const response = await this._request({
        path: `/oauth/token`,
        method: 'POST',
        ignoreAuth: true,
        urlParams: {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken
        }
    })

    const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = response

    this._setToken({
        accessToken,
        refreshToken,
        expiresIn: new Date(new Date().getTime() + expiresIn * 1000)
    })
}
