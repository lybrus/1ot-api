# 1ot nodejs connector

## Installation

### yarn

```shell script
yarn add 1ot-api
```

### npm

```shell script
npm install 1ot-api
```

## Usage

```javascript
import Connector, { primaryStatuses, secondaryStatuses } from '1ot-api'

const username = '...'
const password = '...'

;(async () => {
    const connector = new Connector(/* tokenData if it was saved */)

    // Happen every time new access token received
    connector.on('token', (tokenData) => {
        const { accessToken, expiresIn, refreshToken } = tokenData
        // store token data for reuse
    })

    await connector.auth(username, password)

    const sims = await connector.getSims({ groupName: 'Test group' })

    for (let sim of sims) {
        const {
            status: { primary, secondary }
        } = sim
        if (primary === primaryStatuses.ON) {
            if (secondary === secondaryStatuses.LIVE) {
                // put sim to sleep mode
                await sim.deactivate()
            } else {
                // resume sim from sleep mode
                await sim.activate()
            }
        }
    }
})()
```

## Description

```typescript
import Connector from '1ot-api'

const connector = new Connector(tokenData?: { accessToken: string, expiresIn: Date, refreshToken: string })
```

### Common methods

```typescript
/*
* GET /auth
* when accessToken will be expired, token refreshes automatically
*/
const result: boolean = await connector.auth(username: string, password: string)

// GET /get_account_balance
const balance = await connector.account.balance()

// GET /get_account_groups
const groups = await connector.account.getGroups()

/*
* GET /get_available_profiles
* Account must supports esims
*/
const profiles = await connector.getProfiles()
/*
if groupName is defined     -   GET /get_group_alerts
others                      -   GET /get_account_alerts
*/
const alerts = await connector.getAlerts(params?: { groupName?: string })
```

### Sims selection

```typescript
import { Sim } from '1ot-api'

// GET /get_sim
const sim: Sim = await connector.getSim(params: { iccid?: string, eid?: string})

/*
* Alternative way, without loading sim data
* Usefull for actions on known sims
*/
const sim: Sim = new Sim({iccid?: string, eid?: string})
// It's not necessary
await sim.load()

/*
if iccid or eid are defined     -   GET /get_sims
if groupName is defined         -   GET /get_gpoup_sims
others                          -   GET /get_account_sims
*/
const sims: {
        /* found, limit, total, offset */
        sims: Array<Sim>
    } = await connector.getSims(params?: {
        offset?: number = 0,
        iccid?: (string|Array<string>),
        eid?: (string|Array<string>),
        groupName?: string
    })

/*
* Selecting all sims in several requests if it needed (more than 1000 sims)
* Filtering - same as getSim
*/
const sims: Sims = await connector.getAllSims(filter?: {
    iccid?: (string|Array<string>),
    eid?: (string|Array<string>),
    groupName?: string
})
```

### Sim info

```typescript
// GET /get_sim_alerts
const alerts = await sim.getAlerts(params?: { offset?: number = 0, onlyUnread?: boolean = false, markAsRead?: boolean = false })

// GET /get_sim_cost
const cost = await sim.getCost(date?: Date)

// GET /get_sim_sessions
const sessions = await sim.getSessions({ offset?: number = 0, from?: number, to?: number })
```

### Actions

```typescript
// PUT /close
await sim.close()

/*
* PUT /diagnostics
* Only when feature is enabled in App Store
*/
await sim.diagnostics()

// PUT /esim_profile
await sim.esimProfile(profile: string, action: string)

// PUT /reset
await sim.reset()

// PUT /resume
await sim.resume()

// PUT /sendSms
await sim.sendSms(sms: string)

// PUT /set_data_limit
await sim.setDataLimit(dataLimit: number)

// PUT /set_group
await sim.setGroupt(groupName: string)

// PUT /set_name
await sim.setName(name: string)

// PUT /suspend
await sim.suspend()

// PUT /test
await sim.test()

// PUT /activate
await sim.activate()

// PUT /deactivate
await sim.deactivate()
```

For Sims object (`connector.getAllSims()`) all actions are available (will be apply for every sim inside). For example:
```typescript
const sims = await connector.getAllSims({ groupName: 'Temperature sensors'})
await sims.suspend()
```
