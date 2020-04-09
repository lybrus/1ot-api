import Connector, { primaryStatuses, secondaryStatuses } from '.'

let tokenObjectGlobal

const groupName = process.env.GROUP_NAME
const diagnosticsEnabled = JSON.parse(process.env.DIAGNOSTICS_ENABLED)
const esimsEnabled = JSON.parse(process.env.ESIMS_ENABLED)

const iccids = JSON.parse(process.env.ICCIDS)
const [iccid] = iccids

const newGroupName = `New group ${Math.floor(Math.random() * 100)}`
const newName = `New name ${Math.floor(Math.random() * 100)}`
const newDataLimit = Math.floor(Math.random() * 100)

let initName, initGroupName, initDataLimit

describe('1ot api connector tests', () => {
    test('connector.auth', async () => {
        const connector = new Connector()

        const eventHandler = jest.fn((tokenObject) => {
            tokenObjectGlobal = tokenObject
        })
        connector.on('token', eventHandler)

        const result = await connector.auth(process.env.USERNAME, process.env.PASSWORD)

        expect(eventHandler.mock.calls.length).toBe(1)
        expect(!!eventHandler.mock.calls[0][0].accessToken).toBe(true)

        expect(result).toBe(true)
        expect(connector.auth()).rejects.not.toBeNull()
    })

    test('connector.dataCost', async () => {
        const connector = new Connector(tokenObjectGlobal)
        expect(await connector.account.getBalance()).toHaveProperty('dataCost')
    })

    test('connector.getAlerts', async () => {
        const connector = new Connector(tokenObjectGlobal)
        expect(await connector.getAlerts()).toHaveProperty('alerts')
        expect(await connector.getAlerts({ groupName })).toHaveProperty('alerts')
    })

    test('connector.getGroups', async () => {
        const connector = new Connector(tokenObjectGlobal)
        expect((await connector.account.getGroups()) instanceof Array).toBe(true)
    })

    test('connector.getSims', async () => {
        const connector = new Connector(tokenObjectGlobal)
        expect(await connector.getSims()).toHaveProperty('sims')
        expect(await connector.getSims({ iccid: iccids })).toHaveProperty('sims')
        expect(await connector.getSims({ groupName })).toHaveProperty('sims')
    })

    test('connector.getProfiles', async () => {
        const connector = new Connector(tokenObjectGlobal)
        if (esimsEnabled) {
            expect((await connector.getProfiles()) instanceof Array).toBe(true)
        } else {
            expect(connector.getProfiles()).rejects.toHaveProperty('message', 'Incorrect statusCode: 403')
        }
    })

    test('connector.getSim', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = await connector.getSim({ iccid })
        expect(sim.iccid).toEqual(iccid)
    })

    test('sim.load', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        await sim.load()
        expect(sim.iccid).toEqual(iccid)

        initGroupName = sim.group
        initName = sim.name
        initDataLimit = sim.dataLimit
    })

    test('sim.getSessions', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        expect(await sim.getSessions()).toHaveProperty('sessions')
    })

    test('sim.getCost', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        expect(await sim.getCost()).toHaveProperty('dataPlan')
    })

    test('sim.getAlerts', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        expect(await sim.getAlerts()).toHaveProperty('alerts')
    })

    test('sim.diagnostics', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })

        if (diagnosticsEnabled) {
            expect(await sim.diagnostics()).toHaveProperty('imei')
        } else {
            expect(sim.diagnostics()).rejects.toHaveProperty('message', 'Incorrect statusCode: 403')
        }
    })

    test('sim.setName', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })

        expect(await sim.setName(newName)).toHaveProperty('name', newName)
        await sim.setName(initName)
    })

    test('sim.setGroup', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        expect(await sim.setGroup(newGroupName)).toHaveProperty('group', newGroupName)
        await sim.setGroup(initGroupName)
    })

    test('sim.suspend/resume', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        await sim.load()

        const {
            status: { primary: primaryStatus, secondary: secondaryStatus }
        } = sim
        if (primaryStatus === primaryStatuses.ON) {
            if (secondaryStatus === secondaryStatuses.LIVE) {
                await sim.suspend()
                await sim.resume()
            } else if (secondaryStatus === secondaryStatuses.SUSPENDED) {
                await sim.resume()
                await sim.suspend()
            }
        }
    })

    test('sim.setDataLimit', async () => {
        const connector = new Connector(tokenObjectGlobal)
        const sim = connector.sim({ iccid })
        expect(await sim.setDataLimit(newDataLimit)).toHaveProperty('dataLimit', newDataLimit)
        await sim.setDataLimit(initDataLimit)
    })
})
