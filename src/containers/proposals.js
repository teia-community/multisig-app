import React, { useContext } from 'react';
import { Parser, emitMicheline } from '@taquito/michel-codec';
import { encodePubKey } from '@taquito/utils';
import { TOKENS } from '../constants';
import { MultisigContext } from './context';
import { Button } from './button';
import { TezosAddressLink, TokenLink, IpfsLink } from './links';
import { hexToString } from './utils';


export function Proposals() {
    // Get the required multisig context information
    const { storage, proposals } = useContext(MultisigContext);

    // Separate the proposals between executed, expired and active proposals
    const executedProposals = [];
    const expiredProposals = [];
    const activeProposals = [];

    if (storage && proposals) {
        // Get the expiration time parameter from the storage
        const expirationTime = parseInt(storage.expiration_time);

        // Loop over the complete list of proposals
        const now = new Date();

        for (const proposal of proposals) {
            if (proposal.value.executed) {
                executedProposals.push(proposal);
            } else {
                // Check if the proposal has expired
                const expirationDate = new Date(proposal.value.timestamp);
                expirationDate.setDate(expirationDate.getDate() + expirationTime);

                if (now > expirationDate) {
                    expiredProposals.push(proposal);
                } else {
                    activeProposals.push(proposal);
                }
            }
        }
    }

    return (
        <>
            <section>
                <h2>Active proposals</h2>
                <ProposalList proposals={activeProposals} active />
            </section>

            <section>
                <h2>Executed proposals</h2>
                <ProposalList proposals={executedProposals} />
            </section>

            <section>
                <h2>Expired proposals</h2>
                <ProposalList proposals={expiredProposals} />
            </section>
        </>
    );
}

function ProposalList(props) {
    return (
        <ul className='proposal-list'>
            {props.proposals.map(proposal => (
                <li key={proposal.key}>
                    <Proposal
                        proposalId={proposal.key}
                        proposal={proposal.value}
                        active={props.active}
                    />
                </li>
            ))}
        </ul>
    );
}

function Proposal(props) {
    return (
        <div className='proposal'>
            <ProposalTimestamp timestamp={props.proposal.timestamp} />
            <ProposalDescription
                id={props.proposalId}
                proposal={props.proposal} />
            <ProposalActions
                id={props.proposalId}
                positiveVotes={props.proposal.positive_votes}
                active={props.active}
            />
        </div>
    );
}

function ProposalTimestamp(props) {
    return (
        <span className='proposal-timestamp'>{props.timestamp}</span>
    );
}

function ProposalDescription(props) {
    return (
        <div className='proposal-description'>
            <ProposalDescriptionIntro id={props.id} issuer={props.proposal.issuer} />
            {' '}
            <ProposalDescriptionContent proposal={props.proposal} />
        </div>
    );
}

function ProposalDescriptionIntro(props) {
    return (
        <>
            <span className='proposal-id'>#{props.id}</span>
            <span>
                <TezosAddressLink address={props.issuer} useAlias shorten /> proposed to
            </span>
        </>
    );
}

function ProposalDescriptionContent(props) {
    // Write a different proposal description depending of the proposal kind
    const proposal = props.proposal;

    if (proposal.kind.text) {
        // Try to extract an ipfs path from the proposal text
        const text = hexToString(proposal.text);
        const ipfsPath = text.split('/')[2];

        return (
            <span>
                approve a <IpfsLink path={ipfsPath ? ipfsPath : ''}>text proposal</IpfsLink>.
            </span>
        );
    } else if (proposal.kind.transfer_mutez) {
        // Extract the transfers information
        const transfers = proposal.mutez_transfers;
        const totalAmount = transfers.reduce((previous, current) => previous + parseInt(current.amount), 0);

        if (transfers.length === 1) {
            return (
                <span>
                    transfer {transfers[0].amount / 1000000} ꜩ to <TezosAddressLink address={transfers[0].destination} useAlias shorten />.
                </span>
            );
        } else {
            return (
                <>
                    <span>
                        transfer {totalAmount / 1000000} ꜩ.
                    </span>
                    <details>
                        <summary>See transfer details</summary>
                        <table>
                            <tbody>
                                {transfers.map((transfer, index) => (
                                    <tr key={index}>
                                        <td>
                                            {transfer.amount / 1000000} ꜩ to
                                        </td>
                                        <td>
                                            <TezosAddressLink address={transfer.destination} useAlias shorten />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </details>
                </>
            );
        }
    } else if (proposal.kind.transfer_token) {
        // Extract the transfers information
        const fa2 = proposal.token_transfers.fa2;
        const tokenId = proposal.token_transfers.token_id;
        const transfers = proposal.token_transfers.distribution;
        const nEditions = transfers.reduce((previous, current) => previous + parseInt(current.amount), 0);
        const token = TOKENS.find(token => token.fa2 === fa2);

        if (transfers.length === 1) {
            return (
                <span>
                    transfer {token ? transfers[0].amount / token.decimals : transfers[0].amount}
                    {' '}
                    {token?.multiasset ? `edition${transfers[0].amount > 1 ? 's' : ''} of token` : ''}
                    {' '}
                    <TokenLink fa2={fa2} id={tokenId}>
                        {token ? (token.multiasset ? '#' + tokenId : token.name) : 'tokens'}
                    </TokenLink>
                    {' '}
                    to <TezosAddressLink address={transfers[0].destination} useAlias shorten />.
                </span>
            );
        } else {
            return (
                <>
                    <span>
                        transfer {token ? nEditions / token.decimals : nEditions}
                        {' '}
                        {token?.multiasset ? 'editions of token' : ''}
                        {' '}
                        <TokenLink fa2={fa2} id={tokenId}>
                            {token ? (token.multiasset ? '#' + tokenId : token.name) : 'tokens'}
                        </TokenLink>.
                    </span>
                    <details>
                        <summary>See transfer details</summary>
                        <table>
                            <tbody>
                                {transfers.map((transfer, index) => (
                                    <tr key={index}>
                                        <td>
                                            {token ? transfer.amount / token.decimals : transfer.amount}
                                            {' '}
                                            {token?.multiasset ? `edition${transfer.amount > 1 ? 's' : ''}` : ''} to
                                        </td>
                                        <td>
                                            <TezosAddressLink address={transfer.destination} useAlias shorten />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </details>
                </>
            );
        }
    } else if (proposal.kind.add_user) {
        return (
            <span>
                add <TezosAddressLink address={proposal.user} useAlias shorten /> to the multisig.
            </span>
        );
    } else if (proposal.kind.remove_user) {
        return (
            <span>
                remove <TezosAddressLink address={proposal.user} useAlias shorten /> from the multisig.
            </span>
        );
    } else if (proposal.kind.minimum_votes) {
        return (
            <span>
                change the minimum positive votes required to approve a proposal to {proposal.minimum_votes} votes.
            </span>
        );
    } else if (proposal.kind.expiration_time) {
        return (
            <span>
                change the proposals expiration time to {proposal.expiration_time} days.
            </span>
        );
    } else {
        // Transform the lambda function Michelson JSON code to Micheline code
        const parser = new Parser();
        const michelsonCode = parser.parseJSON(JSON.parse(proposal.lambda_function));
        const michelineCode = emitMicheline(michelsonCode, { indent: '    ', newline: '\n', });

        // Encode any addresses that the Micheline code might contain
        const encodedMichelineCode = michelineCode.replace(
            /0x0[0123]{1}[\w\d]{42}/g,
            (match) => `"${encodePubKey(match.slice(2))}"`
        );

        return (
            <>
                <span>
                    execute a lambda function.
                </span>
                <details>
                    <summary>See Micheline code</summary>
                    <pre className='micheline-code'>
                        {encodedMichelineCode}
                    </pre>
                </details>
            </>
        );
    }
}

function ProposalActions(props) {
    // Get the required multisig context information
    const { userAddress, storage, userVotes, voteProposal, executeProposal } = useContext(MultisigContext);

    // Check if the connected user is a multisig user
    const isUser = storage?.users.includes(userAddress);

    // Check if the proposal can be executed
    const canExecute = props.positiveVotes >= storage?.minimum_votes;

    // Get the vote class name
    const userVote = userVotes && userVotes[props.id];
    let voteClassName = '';

    if (userVote !== undefined) {
        voteClassName = userVote ? ' yes-vote' : ' no-vote';
    }

    return (
        <div className='proposal-extra-information'>
            {props.active && isUser && canExecute &&
                <Button text='execute' onClick={() => executeProposal(props.id)} />
            }

            <span className={'proposal-votes' + voteClassName}>{props.positiveVotes}</span>

            {props.active && isUser &&
                <Button text='YES' onClick={() => voteProposal(props.id, true)} />
            }

            {props.active && isUser &&
                <Button text='NO' onClick={() => voteProposal(props.id, false)} />
            }
        </div>
    );
}
