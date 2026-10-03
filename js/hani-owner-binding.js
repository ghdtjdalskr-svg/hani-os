// Read-only hard gate. Not loaded by application runtime until live proof is available.
// Authentication/owned-row reads are injected by the existing Cloud owner.
const stable = value => {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
};
export function createOwnerBindingGate({getContext, getSource, verifyUser, readOwnedSource, comparable, onInvalidate = () => {}}) {
  if (![getContext, getSource, verifyUser, readOwnedSource, comparable, onInvalidate].every(value => typeof value === 'function'))
    throw new TypeError('Read-only owner dependencies required');
  let epoch = 0, binding = null, verifiedSource = null, verifiedContext = null, verifiedContent = null;
  const invalidate = () => { epoch++; binding = null; verifiedSource = null; verifiedContext = null; verifiedContent = null; onInvalidate(); };
  const signature = context => context && context.userId && context.projectRef && context.datasetId && context.sessionEpoch &&
    stable({userId: context.userId, projectRef: context.projectRef, datasetId: context.datasetId, sessionEpoch: context.sessionEpoch});
  function getBinding() {
    if (!binding) return null;
    try {
      if (signature(getContext()) !== verifiedContext || getSource() !== verifiedSource ||
          stable(comparable(structuredClone(getSource()))) !== verifiedContent) { invalidate(); return null; }
    } catch { invalidate(); return null; }
    return {...binding};
  }
  async function verify() {
    invalidate(); const token = epoch;
    try {
      const context = getContext(), contextSignature = signature(context), source = getSource();
      if (!contextSignature || !source || typeof source !== 'object') throw new Error('SESSION_OR_SOURCE_UNAVAILABLE');
      // Capture the source before any asynchronous read. Do not normalize/migrate it.
      const initial = stable(comparable(structuredClone(source)));
      const check = () => {
        if (token !== epoch || signature(getContext()) !== contextSignature || getSource() !== source ||
            stable(comparable(structuredClone(getSource()))) !== initial) throw new Error('CONTEXT_OR_SOURCE_CHANGED');
      };
      const user = await verifyUser(); check();
      if (!user?.id || user.id !== context.userId) throw new Error('SERVER_USER_MISMATCH');
      // Must return a SELECT result under the same authenticated session, not admin/MCP state.
      const remote = await readOwnedSource(user.id); check();
      if (!remote || remote.user_id !== user.id || !remote.state || !Number.isInteger(remote.revision) || remote.revision < 0)
        throw new Error('OWNED_SOURCE_UNAVAILABLE');
      if (stable(comparable(structuredClone(remote.state))) !== initial) throw new Error('LOCAL_CLOUD_SOURCE_MISMATCH');
      verifiedContext = contextSignature; verifiedSource = source; verifiedContent = initial;
      binding = Object.freeze({projectRef: context.projectRef, userId: user.id, sourceOwnerId: remote.user_id,
        sourceOwnerVerified: true, datasetId: context.datasetId, sessionEpoch: context.sessionEpoch});
      return {status: 'VERIFIED', binding: {...binding}, evidence: {revision: remote.revision, method: 'server-user-owned-row-source-equality'}};
    } catch (error) {
      // An older in-flight attempt must not invalidate a newer successful session.
      if (token === epoch) invalidate();
      return {status: 'OWNER_BINDING_BLOCKED', reason: error.message, binding: null};
    }
  }
  return {verify, getBinding, invalidate};
}
