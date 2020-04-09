import getBalance from './balance'
import getGroups from './groups'
import { bindConnector } from '../utils'

export default (connector) =>
    bindConnector(connector, {
        getBalance,
        getGroups
    })
