import { isAccountHex, isPrincipalText } from '@choptop/haw';

export type AddressType = 'ic' | 'evm';

export interface ChainAddress {
    type: AddressType;
    address: string; // principal or account id if ic,
}

export interface RecentAddress {
    created: number;
    address: ChainAddress;
}

export type RecentAddresses = RecentAddress[];

export interface MarkedAddress {
    created: number;
    updated: number;
    name: string;
    address: ChainAddress;
}

export type MarkedAddresses = MarkedAddress[];

export const check_chain_address = (address: ChainAddress): boolean => {
    switch (address.type) {
        case 'ic':
            return isPrincipalText(address.address) || isAccountHex(address.address);
        case 'evm':
            return /^0x[a-fA-F0-9]{40}$/.test(address.address);
        default:
            throw new Error(`Invalid address type: ${address.type}`);
    }
};
