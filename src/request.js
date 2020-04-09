import bent from 'bent'

const baseUrl = 'https://api.1ot.mobi/v1'

export default async function request({ path, method = 'GET', data, ignoreAuth = false, urlParams = {} }) {
    const { expiresIn } = this

    if (!ignoreAuth) {
        if (!this.authenticated) {
            throw new Error('not auth')
        }

        if (expiresIn < new Date()) {
            await this._refreshToken()
        }
    }

    const { accessToken } = this

    const urlParamsString = Object.keys(urlParams)
        .map((key) =>
            urlParams[key] instanceof Array
                ? urlParams[key].map((value) => `${key}=${value}`).join('&')
                : `${key}=${urlParams[key]}`
        )
        .join('&')

    const fullPath = `${path}${urlParamsString ? '?' : ''}${urlParamsString}`

    const headers = {
        'Content-type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`
    }

    const requestParams = method.toUpperCase() === 'GET' ? [fullPath] : data ? [fullPath, data] : [fullPath]

    const response = await bent(baseUrl, method.toUpperCase(), 'json', headers, 200, 202)(...requestParams)

    return response
}
