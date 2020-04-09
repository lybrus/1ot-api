import { monthYearObject } from '../utils'

export default async function getBalance({ date } = {}) {
    const { data_used: dataUsed, data_cost: dataCost, ...rest } = await this._request({
        path: `/get_account_balance`,
        urlParams: monthYearObject(date)
    })

    return { dataUsed, dataCost, ...rest }
}
