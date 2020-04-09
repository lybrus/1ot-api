async function pause(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds)
    })
}

const LIMIT = 1000

export async function getAllEntities(getter, key, params, limit = LIMIT) {
    let currentOffset = 0
    const result = []

    while (true) {
        const { [key]: entities, found } = await getter({ ...params, offset: currentOffset })
        result.push(...entities)

        if (found < limit) {
            break
        }

        await pause(1000)

        currentOffset += limit
    }

    return result
}

export function bindConnector(connector, object) {
    return Object.keys(object).reduce(
        (prev, key) => ({
            ...prev,
            [key]: object[key].bind(connector)
        }),
        {}
    )
}

export function assignIf(target, source) {
    return Object.assign(
        target,
        Object.keys(source).reduce((prev, key) => (source[key] ? { [key]: source[key], ...prev } : prev), {})
    )
}

export function monthYearObject(date) {
    return date ? { month: date.getMonth() + 1, year: date.getFullYear() } : {}
}
