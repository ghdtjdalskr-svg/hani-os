// Read-only diagnostic bridge. No storage or Cloud writes.
import {createOwnerBindingGate} from './hani-owner-binding.js';

export function createRuntimeOwnerVerifier({getClient, getContext, getSource, comparable, onInvalidate}) {
  if (typeof getClient !== 'function') throw new TypeError('Existing Cloud client required');
  let capturedClient = null;
  const requireClient = () => {
    if (!capturedClient || getClient() !== capturedClient) throw new Error('CLOUD_CLIENT_CHANGED');
    return capturedClient;
  };
  const gate = createOwnerBindingGate({getContext, getSource, comparable, onInvalidate,
    verifyUser: async () => {
      const client = requireClient();
      const {data, error} = await client.auth.getUser();
      requireClient();
      if (error) throw new Error('SERVER_USER_UNAVAILABLE');
      return data?.user;
    },
    readOwnedSource: async userId => {
      const client = requireClient();
      const {data, error} = await client.from('hani_state')
        .select('user_id,state,revision').eq('user_id', userId).limit(1);
      requireClient();
      if (error) throw new Error('OWNED_SOURCE_UNAVAILABLE');
      return data?.[0] ?? null;
    }
  });
  let busy = false;
  return {
    async verify() {
      if (busy) return {status: 'OWNER_BINDING_BLOCKED', reason: 'VERIFICATION_BUSY', binding: null};
      busy = true;
      capturedClient = getClient();
      try { return await gate.verify(); }
      finally { busy = false; }
    },
    getBinding() {
      if (getClient() !== capturedClient) { gate.invalidate(); return null; }
      return gate.getBinding();
    },
    invalidate: gate.invalidate
  };
}
