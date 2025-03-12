import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, type NavigateFunction } from 'react-router-dom';

import Icon from '~components/icon';
import { FusePage } from '~components/layouts/page';
import { FusePageTransition } from '~components/layouts/transition';
import { useCurrentState } from '~hooks/memo/current_state';
import { useGoto } from '~hooks/memo/goto';
import { useCurrentConnectedIcIdentity } from '~hooks/memo/identity';
import {
    useTokenBalanceIcByRefreshing,
    useTokenInfoCustom,
    useTokenInfoIcByInitial,
    useTokenPriceIcByInitial,
} from '~hooks/store/local';
import { useCurrentIdentity } from '~hooks/store/local-secure';
import { useSonnerToast } from '~hooks/toast';
import { FunctionHeader } from '~pages/functions/components/header';
import { match_combined_token_info } from '~types/tokens';
import { get_token_logo, PRESET_ALL_TOKEN_INFO } from '~types/tokens/preset';

function FunctionTokenIcPage() {
    const current_state = useCurrentState();

    const { setHide, goto: _goto, navigate } = useGoto();

    const location = useLocation();
    const [canister_id, setCanisterId] = useState<string>();

    useEffect(() => {
        const canister_id = location.state.canister_id;
        if (!canister_id) return _goto(-1);
        setCanisterId(canister_id);
    }, [_goto, location]);

    if (!canister_id) return <></>;
    return (
        <FusePage current_state={current_state} options={{ refresh_token_info_ic_sleep: 1000 * 60 * 5 }}>
            <FusePageTransition setHide={setHide}>
                <div className="relative flex h-full w-full flex-col items-center justify-start pt-[52px]">
                    <InnerPage canister_id={canister_id} navigate={navigate} />
                </div>
            </FusePageTransition>
        </FusePage>
    );
}

export default FunctionTokenIcPage;

const InnerPage = ({ canister_id, navigate }: { canister_id: string; navigate: NavigateFunction }) => {
    const { goto: _goto } = useGoto();
    const toast = useSonnerToast();
    const { current_identity } = useCurrentIdentity();
    const [custom] = useTokenInfoCustom();

    const allTokens = useMemo(() => [...PRESET_ALL_TOKEN_INFO, ...custom.map((t) => t.token)], [custom]);

    const token = useTokenInfoIcByInitial(canister_id);
    const [logo, setLogo] = useState<string>();

    useEffect(() => {
        if (!canister_id) return;

        const token = allTokens.find((t) =>
            match_combined_token_info(t.info, { ic: (ic) => ic.canister_id === canister_id }),
        );

        if (!token) throw new Error('Unknown token info');
        get_token_logo(token.info).then(setLogo);
    }, [allTokens, canister_id]);

    // price
    const token_price = useTokenPriceIcByInitial(canister_id);
    // balance
    const identity = useCurrentConnectedIcIdentity(current_identity?.id);
    // { refreshBalance }
    const [[balance]] = useTokenBalanceIcByRefreshing(identity?.principal, [canister_id], 5000);

    const showBalance = useMemo<string | undefined>(() => {
        if (token === undefined || balance === undefined) return undefined;
        return new BigNumber(balance).dividedBy(new BigNumber(10).pow(new BigNumber(token.decimals))).toFixed();
    }, [token, balance]);

    const tokenUsd = useMemo(() => {
        if (token_price === undefined || token === undefined || balance === undefined) return undefined;
        if (token_price?.price === undefined) return undefined;

        const { price } = token_price;
        return BigNumber(balance).times(BigNumber(price)).div(BigNumber(10).pow(token?.decimals)).toFormat(2);
    }, [balance, token_price, token]);

    const [price, price_changed_24h] = useMemo(() => {
        if (token_price === undefined) return [undefined, undefined];
        return [token_price.price, token_price.price_change_24h];
    }, [token_price]);

    // test
    const text =
        'The Internet Computer is a public blockchain network enabled by new science from first principles. It is millions of times more powerful and can replace clouds and traditional IT. The network – created by ICP, or Internet Computer Protocol – is orchestrated by permissionless decentralized governance and is hosted on sovereign hardware devices run by independent parties. Its purpose is to extend the public internet with native cloud computing functionality.';
    const [isExpanded, setIsExpanded] = useState(false);
    const truncatedText = text.slice(0, 200);
    const shouldTruncate = text.length > 200;

    return (
        <>
            <FunctionHeader title={token?.symbol || ''} onBack={() => _goto('/')} onClose={() => _goto('/')} />

            <div className="overflow-y-auto flex-1 mt-3 w-full">
                <div className="flex items-center px-5 w-full">
                    <img
                        src={logo ?? 'https://metrics.icpex.org/images/ryjl3-tyaaa-aaaaa-aaaba-cai.png'}
                        className="mr-2 w-10 h-10 rounded-full"
                    />
                    <div className="w-auto">
                        <div className="block text-sm text-[#999999]">
                            <strong className="pr-3 text-base text-[#EEEEEE]">{token?.name}</strong>
                            {token?.symbol}
                        </div>

                        <div className="m-1 block text-sm text-[#999999]">
                            {price === undefined && (
                                <span className="text-xs text-[#999999]">
                                    <span className="opacity-0">--</span>
                                </span>
                            )}
                            {price !== undefined && (
                                <>
                                    <span className="text-xs text-[#999999]">${BigNumber(price).toFormat(2)}</span>
                                    {price_changed_24h !== undefined && price_changed_24h.startsWith('-') && (
                                        <span className="pl-2 text-xs text-[#FF2C40]">
                                            {BigNumber(price_changed_24h).toFormat(2)}%
                                        </span>
                                    )}
                                    {price_changed_24h !== undefined && !price_changed_24h.startsWith('-') && (
                                        <span className="pl-2 text-xs text-[#00C431]">
                                            +{BigNumber(price_changed_24h).toFormat(2)}%
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-5 my-4">
                    <div className="flex items-center">
                        <strong className="text-4xl text-[#FFCF13]">{showBalance}</strong>
                        <Icon name="icon-wallet" className="ml-3 h-4 w-4 text-[#999999]" />
                    </div>
                    <span className="block w-full text-sm text-[#999999]">≈${tokenUsd}</span>
                </div>
                <div className="flex justify-between items-center px-5 my-2 w-full">
                    {[
                        {
                            callback: () => navigate('/home/token/ic/transfer', { state: { canister_id } }),
                            icon: 'icon-send',
                            name: 'Send',
                        },
                        {
                            callback: () => navigate('/home/token/ic/receive'),
                            icon: 'icon-receive',
                            name: 'Receive',
                        },
                        {
                            callback: () => {
                                toast.info('Come soon');
                                // navigate('/home/swap')
                            },
                            icon: 'icon-swap',
                            name: 'Swap',
                        },
                        {
                            callback: () => {
                                toast.info('Come soon');
                            },
                            icon: 'icon-history',
                            name: 'History',
                        },
                    ].map(({ callback, icon, name }) => (
                        <div
                            key={icon}
                            onClick={callback}
                            className="flex h-[70px] w-[70px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-[#333333] transition duration-300 hover:border-[#FFCF13]"
                        >
                            <Icon
                                name={icon}
                                className="h-[20px] w-[20px] cursor-pointer font-semibold text-[#FFCF13]"
                            />
                            <span className="pt-1 text-xs text-[#EEEEEE]">{name}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col px-5 w-full">
                    <h3 className="py-2 text-sm text-[#999999]">About</h3>
                    <div className="text-sm">
                        {isExpanded ? text : truncatedText}
                        {shouldTruncate && (
                            <>
                                {!isExpanded && '...'}
                                <span
                                    className="ml-2 cursor-pointer text-[#FFCF13]"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? 'Less' : 'More'}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="mt-5 w-full rounded-xl bg-[#181818]">
                        <div className="flex justify-between items-center px-3 py-2 w-full text-sm">
                            <span className="text-[#999999]">Market cap</span>
                            <span>$4,967,486,846</span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 w-full text-sm">
                            <span className="text-[#999999]">FDV</span>
                            <span>$5,479,917,847</span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 w-full text-sm">
                            <span className="text-[#999999]">Circulating Supply</span>
                            <span>479,349,112</span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-2 w-full text-sm">
                            <span className="text-[#999999]">Total supply</span>
                            <span>528,797,325</span>
                        </div>
                        <div className="flex items-center p-3 w-full">
                            <Icon
                                name="icon-web"
                                className="h-4 w-4 cursor-pointer duration-300 hover:text-[#FFCF13]"
                            />
                            <Icon
                                name="icon-x"
                                className="mx-3 h-3 w-3 cursor-pointer duration-300 hover:text-[#FFCF13]"
                            />
                            <Icon
                                name="icon-discord"
                                className="h-4 w-4 cursor-pointer duration-300 hover:text-[#FFCF13]"
                            />
                        </div>
                    </div>
                </div>

                <div className="pb-5 mt-5 w-full">
                    <h3 className="block px-5 pb-4 text-sm text-[#999999]">Transactions</h3>
                    {/* test data */}
                    <div className="flex flex-col w-full">
                        <span className="px-5 py-[5px] text-xs text-[#999999]">02/24/2025</span>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://metrics.icpex.org/images/ryjl3-tyaaa-aaaaa-aaaba-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Send</strong>
                                    <span className="text-xs text-[#999999]">To uyrhg...cqe</span>
                                </div>
                            </div>
                            <div className="text-base font-semibold text-[#EEEEEE]">-11.55 ICP</div>
                        </div>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://metrics.icpex.org/images/ryjl3-tyaaa-aaaaa-aaaba-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Swap</strong>
                                    <span className="text-xs text-[#999999]">To ICS</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-sm text-[#999999]">-1.34 ICP</div>
                                <div className="text-base font-semibold text-[#00C431]">+42,582.76 ICS</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="px-5 py-[5px] text-xs text-[#999999]">01/20/2025</span>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://metrics.icpex.org/images/xevnm-gaaaa-aaaar-qafnq-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Send</strong>
                                    <span className="text-xs text-[#999999]">To uyrhg...cqe</span>
                                </div>
                            </div>
                            <div className="text-base font-semibold text-[#EEEEEE]">-374 ckUSDC</div>
                        </div>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://metrics.icpex.org/images/ryjl3-tyaaa-aaaaa-aaaba-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Reveive</strong>
                                    <span className="text-xs text-[#999999]">From 87bba...413</span>
                                </div>
                            </div>
                            <div className="text-base font-semibold text-[#00C431]">+36.98 ICP</div>
                        </div>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://metrics.icpex.org/images/o64gq-3qaaa-aaaam-acfla-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Reveive</strong>
                                    <span className="text-xs text-[#999999]">From 87bba...413</span>
                                </div>
                            </div>
                            <div className="text-base font-semibold text-[#00C431]">+92,387,862 ICU</div>
                        </div>
                        <div className="flex w-full cursor-pointer items-center justify-between px-5 py-[10px] transition duration-300 hover:bg-[#333333]">
                            <div className="flex items-center">
                                <img
                                    src="https://app.icpswap.com/images/tokens/ca6gz-lqaaa-aaaaq-aacwa-cai.png"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="ml-[10px]">
                                    <strong className="block text-base text-[#EEEEEE]">Swap</strong>
                                    <span className="text-xs text-[#999999]">To ICS</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-sm text-[#999999]">-3.8 ICP</div>
                                <div className="text-base font-semibold text-[#00C431]">+89,452.34 ICS</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
