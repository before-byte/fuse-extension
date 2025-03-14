import { Storage } from '@plasmohq/storage';

import { sha256_hash } from '~lib/utils/hash';
import { is_same_popup_action, type PopupAction, type PopupActions } from '~types/actions';
import { type Chain } from '~types/chain';
import type { CurrentIdentityNetwork } from '~types/network';

import { identity_network_callback } from '../common';
import {
    SESSION_KEY_CURRENT_SESSION_APPROVE_ONCE,
    SESSION_KEY_CURRENT_SESSION_APPROVE_SESSION,
    SESSION_KEY_CURRENT_SESSION_CONNECTED_APP,
    SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_ONCE,
    SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_SESSION,
    SESSION_KEY_PASSWORD,
    SESSION_KEY_PASSWORD_ALIVE,
    SESSION_KEY_POPUP_ACTIONS,
} from '../keys';
import { usePasswordInner } from './password';
import { usePasswordAliveInner } from './password_alive';
import { usePathnameInner } from './pathname';
import { usePopupActionsInner2 } from './popup_actions';
import { useRestoreInner } from './restore';

// * session -> current session
const SESSION_STORAGE = new Storage({ area: 'session' }); // session
// const session_secure_storage = new SecureStorage({ area: 'session' }); // session
export const __get_session_storage = () => SESSION_STORAGE;

const CACHED_PASSWORD: Record<string, string> = {};
export const __set_password = (hash: string, password: string) => (CACHED_PASSWORD[hash] = password);
export const __get_password = (hash: string) => CACHED_PASSWORD[hash] ?? '';

// ================ hooks ================

// ############### SESSION ###############
export const usePassword = () => usePasswordInner(SESSION_STORAGE); // session
export const usePasswordAlive = () => usePasswordAliveInner(SESSION_STORAGE); // session
export const useRestore = () => useRestoreInner(SESSION_STORAGE); // session
export const usePopupActions = () => usePopupActionsInner2(SESSION_STORAGE); // session
export const usePathname = () => usePathnameInner(SESSION_STORAGE); // session

// ================ set directly by storage ================

// ############### SESSION ###############

// password
export const setPasswordAliveDirectly = async (password_alive = Date.now()) => {
    await SESSION_STORAGE.set(SESSION_KEY_PASSWORD_ALIVE, password_alive);
};
export const setPasswordDirectly = async (password: string) => {
    const hashed = await (async () => {
        if (!password) return '';
        let hashed = await sha256_hash(password);
        for (let i = 0; i < 2048; i++) hashed = await sha256_hash(`${password}:${hashed}`);
        return hashed;
    })();
    __set_password(hashed, password);
    await SESSION_STORAGE.set(SESSION_KEY_PASSWORD, hashed);
};
export const refreshPasswordDirectly = async (password: string) => {
    await setPasswordAliveDirectly(); // must before set password
    await setPasswordDirectly(password);
};
export const lockDirectly = async () => {
    await setPasswordDirectly(''); // remove password
    await setPasswordAliveDirectly(0);
};

// current status
export const is_current_locked = async (): Promise<boolean> => {
    const password = await SESSION_STORAGE.get<string>(SESSION_KEY_PASSWORD);
    return !password;
};

// once user connect app, is_connected always cloud be true
export const query_current_session_connected_app = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
): Promise<boolean> => {
    return identity_network_callback(chain, current_identity_network, false, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP(identity_network, origin);
        return !!(await SESSION_STORAGE.get<boolean>(key));
    });
};
export const grant_current_session_connected_app = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
) => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP(identity_network, origin);
        await SESSION_STORAGE.set(key, true);
    });
};
export const revoke_current_session_connected_app = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
) => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP(identity_network, origin);
        await SESSION_STORAGE.remove(key);
    });
};
export const reset_current_session_connected_app = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    granted: boolean,
) => {
    if (granted) await grant_current_session_connected_app(chain, current_identity_network, origin);
    else await revoke_current_session_connected_app(chain, current_identity_network, origin);
};

// marked granted/denied once
export const find_current_session_connected_app_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    message_id: string,
): Promise<boolean | undefined> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_ONCE(identity_network, origin, message_id);
        return await SESSION_STORAGE.get<boolean>(key);
    });
};
export const delete_current_session_connected_app_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    message_id: string,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_ONCE(identity_network, origin, message_id);
        await SESSION_STORAGE.remove(key);
    });
};
export const set_current_session_connected_app_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    message_id: string,
    granted: boolean,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_ONCE(identity_network, origin, message_id);
        await SESSION_STORAGE.set(key, granted);
    });
};

// marked granted/denied session
export const find_current_session_connected_app_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
): Promise<boolean | undefined> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_SESSION(identity_network, origin);
        return await SESSION_STORAGE.get<boolean>(key);
    });
};
export const delete_current_session_connected_app_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_SESSION(identity_network, origin);
        await SESSION_STORAGE.remove(key);
    });
};
export const set_current_session_connected_app_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    granted: boolean,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_CONNECTED_APP_SESSION(identity_network, origin);
        await SESSION_STORAGE.set(key, granted);
    });
};

// marked granted/denied once
export const find_current_session_approve_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    approve_id: string,
): Promise<boolean | undefined> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_ONCE(identity_network, origin, approve_id);
        return await SESSION_STORAGE.get<boolean>(key);
    });
};
export const delete_current_session_approve_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    approve_id: string,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_ONCE(identity_network, origin, approve_id);
        await SESSION_STORAGE.remove(key);
    });
};
export const set_current_session_approve_once = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    approve_id: string,
    approved: boolean,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_ONCE(identity_network, origin, approve_id);
        await SESSION_STORAGE.set(key, approved);
    });
};

// marked granted/denied session
export const find_current_session_approve_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    request_hash: string,
): Promise<boolean | undefined> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_SESSION(identity_network, origin, request_hash);
        return await SESSION_STORAGE.get<boolean>(key);
    });
};
export const delete_current_session_approve_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    request_hash: string,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_SESSION(identity_network, origin, request_hash);
        await SESSION_STORAGE.remove(key);
    });
};
export const set_current_session_approve_session = async (
    chain: Chain,
    current_identity_network: CurrentIdentityNetwork,
    origin: string,
    request_hash: string,
    approved: boolean,
): Promise<void> => {
    return identity_network_callback(chain, current_identity_network, undefined, async (identity_network) => {
        const key = SESSION_KEY_CURRENT_SESSION_APPROVE_SESSION(identity_network, origin, request_hash);
        await SESSION_STORAGE.set(key, approved);
    });
};

// temp popup actions
export const get_popup_actions = async (): Promise<PopupActions> => {
    return (await SESSION_STORAGE.get<PopupActions>(SESSION_KEY_POPUP_ACTIONS)) ?? [];
};
export const delete_all_popup_actions = async (): Promise<PopupActions> => {
    const actions = await get_popup_actions();
    await SESSION_STORAGE.remove(SESSION_KEY_POPUP_ACTIONS);
    return actions;
};
export const delete_popup_action = async (action: PopupAction): Promise<void> => {
    let actions = await get_popup_actions();
    const a = actions.find((a) => is_same_popup_action(a, action));
    if (a === undefined) return;
    actions = actions.filter((a) => !is_same_popup_action(a, action));
    if (actions.length) await SESSION_STORAGE.set(SESSION_KEY_POPUP_ACTIONS, actions);
    else await SESSION_STORAGE.remove(SESSION_KEY_POPUP_ACTIONS);
};
export const push_popup_action = async (action: PopupAction): Promise<void> => {
    const actions = await get_popup_actions();
    const a = actions.find((a) => is_same_popup_action(a, action));
    if (a !== undefined) return; // already exists
    actions.push(action);
    await SESSION_STORAGE.set(SESSION_KEY_POPUP_ACTIONS, actions);
};
