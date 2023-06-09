import React, { PureComponent } from 'react'

import redux from '@obsidians/redux'
import Navbar from '@obsidians/navbar'
import keypairManager from '@obsidians/keypair'
import { navbarItem } from '@obsidians/workspace'
import { NewProjectModal } from '@obsidians/eth-project'
import { networkManager } from '@obsidians/eth-network'
import { utils } from '@obsidians/sdk'
import { t } from '@obsidians/i18n'

import headerActions from './headerActions'

class Header extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      keypairs: []
    }
  }

  componentDidMount() {
    keypairManager.loadAllKeypairs().then(this.updateKeypairs)
    keypairManager.onUpdated(this.updateKeypairs)
  }

  updateKeypairs = keypairs => this.setState({ keypairs })

  render() {
    const {
      noExplorer,
      profile,
      projects,
      selectedProject,
      starred = [],
      starredContracts = starred,
      keypairManagerFilter,
      browserAccounts = [],
      extraContractItems,
      selectedContract,
      selectedAccount,
      network,
      networkList,
      AuthModal,
      createProject,
      logo = null,
    } = this.props

    const username = profile.get('username') || projects.get('selected')?.toJS()?.author
    const navbarLeft = [
      navbarItem(projects, selectedProject, username)
    ]

    const contractIcon = isSelected => isSelected ? 'fas fa-file-invoice' : 'far fa-file'
    const addressIcon = isSelected => isSelected ? 'fas fa-map-marker-alt' : 'far fa-map-marker'

    let dropdownKeypairs = this.state.keypairs.map(k => {
      const address = k.address
      return {
        id: address,
        name: k.name || <code className='small'>{utils.isValidAddressReturn(address).substr(0, 10)}...{utils.isValidAddressReturn(address).substr(-8)}</code>,
        icon: addressIcon,
      }
    })
    if (keypairManagerFilter) {
      dropdownKeypairs = dropdownKeypairs.filter(keypairManagerFilter)
    }
    if (!dropdownKeypairs.length) {
      dropdownKeypairs.push({ none: true })
    }
    dropdownKeypairs.unshift({ header: '密钥列表' })

    const dropdownBrowserAccounts = browserAccounts.map(item => {
      const name = keypairManager.getName(item)
      return {
        id: item,
        name: name || <code className='small'>{utils.isValidAddressReturn(item).substr(0, 10)}...{utils.isValidAddressReturn(item).substr(-8)}</code>,
        icon: addressIcon,
      }
    })
    if (dropdownBrowserAccounts.length) {
      if (networkManager.browserExtension) {
        dropdownBrowserAccounts.unshift({ header: networkManager.browserExtension.name.toLowerCase() })
      }
      dropdownBrowserAccounts.unshift({ divider: true })
    }

    const dropdownStarred = starred.map(item => {
      const name = keypairManager.getName(item)
      return {
        id: item,
        name: name || <code className='small'>{utils.isValidAddressReturn(item).substr(0, 10)}...{utils.isValidAddressReturn(item).substr(-8)}</code>,
        icon: addressIcon,
      }
    })

    const dropdownStarredContracts = starredContracts.map(item => {
      return {
        id: item,
        name: <code className='small'>{utils.isValidAddressReturn(item).substr(0, 10)}...{utils.isValidAddressReturn(item).substr(-8)}</code>,
        icon: addressIcon,
      }
    })

    let dropdownStarredInContract = [{ header: '已收藏' }, ...dropdownStarredContracts.map(item => ({ ...item, icon: contractIcon }))]
    if (dropdownStarred.length) {
      dropdownStarred.unshift({ header: '已收藏' })
      dropdownStarred.unshift({ divider: true })
    }
    if (!starredContracts.length) {
      dropdownStarredInContract.push({ none: true })
    }
    if (extraContractItems) {
      dropdownStarredInContract = [...extraContractItems, ...dropdownStarredInContract]
    }

    let contractName
    if (selectedContract) {
      if (extraContractItems) {
        // todo:process address for this case
        contractName = extraContractItems.find(item => item.id === selectedContract)?.name
      }
      if (!contractName) {
        contractName = <code>{utils.isValidAddressReturn(selectedContract)}</code>
      }
    }

    const selectAccountTemp = utils.isValidAddressReturn(selectedAccount)
    const accountName = selectAccountTemp && (keypairManager.getName(selectAccountTemp) || <code>{selectAccountTemp}</code>)

    const contractNavbarItem = {
      route: 'contract',
      title: t('header.title.contract'),
      icon: 'fas fa-file-invoice',
      selected: { id: selectedContract, name: contractName },
      dropdown: dropdownStarredInContract,
      onClickItem: selected => headerActions.selectContract(network.id, selected),
      contextMenu: () => [{
        text: 'Remove from Starred',
        onClick: ({ id }) => redux.dispatch('REMOVE_ACCOUNT', { network: network.id, account: id }),
      }],
    }
    const explorerNavbarItem = {
      route: 'account',
      title: t('header.title.explorer'),
      icon: 'fas fa-map-marker-alt',
      noneIcon: 'fas fa-globe',
      selected: { id: selectedAccount, name: accountName },
      dropdown: [...dropdownKeypairs, ...dropdownBrowserAccounts, ...dropdownStarred],
      onClickItem: selected => headerActions.selectAccount(network.id, selected),
      contextMenu: address => {
        if (starred.indexOf(address) === -1) {
          return
        }
        return [{
          text: 'Remove from Starred',
          onClick: ({ id }) => {
            redux.dispatch('REMOVE_ACCOUNT', { network: network.id, account: id })
          },
        }]
      },
    }

    const networkReplaceName = Object.assign({}, network, { name: network.fullName })
    const networkNavbarItem = {
      route: 'network',
      title: t('header.title.network'),
      icon: network.icon,
      selected: networkReplaceName,
      dropdown: networkList,
      onClickItem: (_, network) => {
        if (network.id === 'custom') redux.dispatch('CUSTOM_MODAL_STATUS', true)
        if (network.id !== 'custom') networkManager.setNetwork(network)
      },
    }

    const navbarRight = noExplorer
      ? [contractNavbarItem, networkNavbarItem]
      : [contractNavbarItem, explorerNavbarItem, networkNavbarItem]

    return (
      <>
        <Navbar
          profile={profile}
          navbarLeft={navbarLeft}
          navbarRight={navbarRight}
          noUser={this.props.noUser}
        >
          {logo}
        </Navbar>
        <NewProjectModal createProject={createProject} />
        {AuthModal && <AuthModal />}
      </>
    )
  }
}

Header.defaultProps = {
  noUser: false
}

export default Header