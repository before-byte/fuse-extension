import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FusePage } from '~components/layouts/page';
import { useCurrentState } from '~hooks/memo/current_state';
import { useRestoreAccount } from '~hooks/memo/restore_account';
import { useIdentityKeys } from '~hooks/store/local-secure';
import { validate_mnemonic } from '~lib/mnemonic';
import type { CombinedIdentityKey } from '~types/identity';
import type { WindowType } from '~types/pages';
import { CurrentState } from '~types/state';

import InputPasswordPage from './pages/password';
import RestoreMnemonicPage from './pages/restore_mnemonic';
import RestorePrivateKeyPage from './pages/restore_private_key';
import RestoreWayPage from './pages/restore_way';

type RestoreState = 'way' | 'mnemonic' | 'private_key' | 'password';

function CreateRestorePage({ wt, extra }: { wt: WindowType; extra?: boolean }) {
    const current_state = useCurrentState();

    const navigate = useNavigate();

    const { restoreAccountByMnemonic } = useRestoreAccount(current_state);
    const { isKeyExist, pushIdentity } = useIdentityKeys();

    const [state, setState] = useState<RestoreState>('way');
    const [last_state, setLastState] = useState<'mnemonic' | 'private_key'>();

    const [mnemonic, setMnemonic] = useState('');

    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');

    const onMnemonicCompleted = useCallback(async () => {
        if (!mnemonic || !validate_mnemonic(mnemonic)) return;

        if (extra) {
            const key: CombinedIdentityKey = {
                mnemonic: {
                    type: 'mnemonic',
                    mnemonic,
                    subaccount: 0,
                },
            };
            isKeyExist(key).then((exist) => {
                if (exist) throw new Error('key already exists');
                pushIdentity(key).then((r) => {
                    if (r === undefined) throw Error('push identity failed');
                    if (r === false) throw new Error('push identity failed');
                    navigate(-2); // back 2 pages
                });
            });
            return;
        }

        await restoreAccountByMnemonic(password1, mnemonic);
        if (wt === 'options') {
            await chrome.action.openPopup();
            // window.close(); // close window if current window is individual page
        }
    }, [extra, password1, mnemonic, restoreAccountByMnemonic, isKeyExist, pushIdentity, wt, navigate]);

    const onPrivateKeyCompleted = useCallback(async () => {
        throw new Error('unimplemented');
    }, []);

    return (
        <FusePage
            current_state={current_state}
            states={extra ? CurrentState.ALIVE : [CurrentState.INITIAL, CurrentState.LOCKED]}
        >
            {/* Import Wallet - Select the way to import the wallet */}
            {state === 'way' && (
                <RestoreWayPage
                    onBack={() => navigate(-1)}
                    onNext={(way) => {
                        setLastState(way);
                        setState(way);
                    }}
                />
            )}

            {/* Import wallet - Mnemonics */}
            {state === 'mnemonic' && (
                <RestoreMnemonicPage
                    onBack={() => setState('way')}
                    mnemonic={mnemonic}
                    setMnemonic={setMnemonic}
                    onNext={() => (extra ? onMnemonicCompleted() : setState('password'))}
                />
            )}

            {/* Import the wallet - private key */}
            {state === 'private_key' && (
                <RestorePrivateKeyPage
                    onBack={() => setState('way')}
                    onNext={() => (extra ? onPrivateKeyCompleted() : setState('password'))}
                />
            )}

            {/* Password Creation Wallet */}
            {state === 'password' && (
                <InputPasswordPage
                    onBack={() => setState(last_state ?? 'way')}
                    password1={password1}
                    setPassword1={setPassword1}
                    password2={password2}
                    setPassword2={setPassword2}
                    onNext={onMnemonicCompleted}
                />
            )}
        </FusePage>
    );
}

export default CreateRestorePage;
