import React, { useContext } from 'react';
import { NETWORK, IPFS_GATEWAY, TOKENS } from '../constants';
import { MultisigContext } from './context';


export function DefaultLink(props) {
    return (
        <a href={props.href} target='_blank' rel='noreferrer' className={props.className ? props.className : ''}>
            {props.children}
        </a>
    );
}

export function TzktLink(props) {
    return (
        <DefaultLink href={`https://${NETWORK}.tzkt.io/${props.address}`} className={props.className ? props.className : ''}>
            {props.children}
        </DefaultLink>
    );
}

export function TezosAddressLink(props) {
    // Get the required multisig context information
    const { userAliases } = useContext(MultisigContext);

    // Get the user alias
    const alias = userAliases && userAliases[props.address];

    return (
        <TzktLink address={props.address} className={`tezos-address ${props.className ? props.className : ''}`}>
            {props.children}
            {props.useAlias && alias ?
                alias :
                props.shorten ? props.address.slice(0, 5) + '...' + props.address.slice(-5) : props.address
            }
        </TzktLink>
    );
}

export function TokenLink(props) {
    const token = TOKENS.find(token => token.fa2 === props.fa2);

    if (token?.website) {
        return (
            <DefaultLink href={token.website + props.id} className={`token-link ${props.className ? props.className : ''}`}>
                {props.children}
            </DefaultLink>
        );
    } else {
        return (
            <TzktLink address={props.fa2} className={`token-link ${props.className ? props.className : ''}`}>
                {props.children}
            </TzktLink>
        );
    }
}

export function IpfsLink(props) {
    return (
        <DefaultLink href={IPFS_GATEWAY + props.path} className={`ipfs-link ${props.className ? props.className : ''}`}>
            {props.children ? props.children : props.path}
        </DefaultLink>
    );
}
