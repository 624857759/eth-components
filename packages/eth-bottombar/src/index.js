import React from 'react'
import CacheRoute from 'react-router-cache-route'
import { connect } from '@obsidians/redux'
import Auth from '@obsidians/auth'
import { KeypairButton } from '@obsidians/keypair'
import { TerminalButton } from '@obsidians/workspace'
import Network, { NetworkStatus, networkManager } from '@obsidians/eth-network'
import { QueueButton } from '@obsidians/eth-queue'
import { AbiStorage } from '@obsidians/eth-contract'
import { CompilerSelectors } from '@obsidians/compiler'
import { useInterval } from '@obsidians/hooks'
import redux from '@obsidians/redux'
import { t } from '@obsidians/i18n'

export default connect(['network', 'networkConnect', 'queue', 'projects', 'uiState', 'loadNetworkResources'])(function BottomBar(props) {
  const {
    network,
    queue,
    projects,
    uiState,
    networkConnect,
    mnemonic = true,
    secretName = mnemonic ? 'Private Key / Mnemonic' : 'Private Key',
    chains,
    noNetwork = false,
    loadNetworkResources,
  } = props

  const localNetwork = uiState.get('localNetwork')

  const handleStatusRefresh = () => {
    redux.dispatch('CHANGE_NETWORK_STATUS', !networkConnect)
    if(networkConnect) {
      redux.dispatch('SELECT_NETWORK', '')
    }
  }

  let txs
  if (network !== 'dev') {
    txs = queue.getIn([network, 'txs'])
  } else if (localNetwork && localNetwork.lifecycle === 'started') {
    txs = queue.getIn([localNetwork.params.id, 'txs'])
  }

  const selectedProject = projects.get('selected')
  const loaded = selectedProject?.get('loaded')

  useInterval(async () => {
    try {
      await networkManager.sdk?.networkInfo()
      redux.dispatch('CHANGE_NETWORK_STATUS', true)
    } catch (error) {
      console.log(error)
      redux.dispatch('CHANGE_NETWORK_STATUS', false)
    }
  }, networkConnect ? 60000 : null)

  return <>
    <KeypairButton mnemonic={mnemonic} secretName={secretName} chains={chains}>
      <div className='btn btn-primary btn-sm btn-flat'>
        <i className='fas fa-key' />
      </div>
    </KeypairButton>
    {!loadNetworkResources && <div hidden><Network /></div>}
    {!noNetwork && <NetworkStatus connected={networkConnect} onRefresh={handleStatusRefresh} />}
    <QueueButton txs={txs} />
    {/* { !noNetwork && <NetworkStatus /> }

   
    <AbiStorage>
      <div className='btn btn-default btn-sm btn-flat text-muted'>
        <i className='fas fa-list mr-1' />
        {t('abi.storage')}
      </div>
    </AbiStorage> */}

    <div className='flex-1' />
    {
      loaded && (
        <>
          <CacheRoute
            path={[`/${Auth.username}/:project`, '/local/:project']}
            render={() => <CompilerSelectors author={selectedProject.get('author')} />}
          />
          <CacheRoute
            path={[`/${Auth.username}/:project`, '/local/:project']}
            component={TerminalButton}
          />
        </>)
    }
  </>
})
