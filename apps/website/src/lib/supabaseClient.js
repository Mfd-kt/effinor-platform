/**
 * Supabase désactivé — mock no-op.
 *
 * Toutes les méthodes retournent une promesse résolue avec des données vides.
 * Les 55+ fichiers qui importent ce module continuent de fonctionner sans erreur,
 * mais aucune requête réseau n'est envoyée vers Supabase.
 *
 * Les écritures leads (mini-form, page contact) passent par miniFormLeadSupabase.js + clé anon.
 */

const noop = () => {};
const emptyResult = { data: null, error: null, count: 0 };
const resolvedEmpty = Promise.resolve(emptyResult);

/** Chaîne de requête — chaque méthode retourne `this` pour permettre le chainage */
class QueryBuilder {
  select()     { return this; }
  insert()     { return this; }
  update()     { return this; }
  upsert()     { return this; }
  delete()     { return this; }
  eq()         { return this; }
  neq()        { return this; }
  gt()         { return this; }
  gte()        { return this; }
  lt()         { return this; }
  lte()        { return this; }
  like()       { return this; }
  ilike()      { return this; }
  in()         { return this; }
  contains()   { return this; }
  filter()     { return this; }
  match()      { return this; }
  not()        { return this; }
  or()         { return this; }
  order()      { return this; }
  limit()      { return this; }
  range()      { return this; }
  single()     { return this; }
  maybeSingle(){ return this; }
  csv()        { return this; }
  explain()    { return this; }

  // Résolution de la promesse
  then(resolve) { return resolvedEmpty.then(resolve); }
  catch(reject) { return resolvedEmpty.catch(reject); }
}

/** Mock auth */
const authMock = {
  getSession:           () => Promise.resolve({ data: { session: null }, error: null }),
  getUser:              () => Promise.resolve({ data: { user: null }, error: null }),
  onAuthStateChange:    (cb) => { cb('INITIAL_SESSION', null); return { data: { subscription: { unsubscribe: noop } } }; },
  signInWithPassword:   () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase désactivé' } }),
  signOut:              () => Promise.resolve({ error: null }),
  signUp:               () => Promise.resolve({ data: null, error: { message: 'Supabase désactivé' } }),
  updateUser:           () => Promise.resolve({ data: null, error: null }),
  resetPasswordForEmail:() => Promise.resolve({ data: null, error: null }),
};

/** Mock storage */
const storageMock = {
  from: () => ({
    upload:   () => Promise.resolve({ data: null, error: null }),
    download: () => Promise.resolve({ data: null, error: null }),
    remove:   () => Promise.resolve({ data: null, error: null }),
    list:     () => Promise.resolve({ data: [],   error: null }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
  }),
};

/** Mock realtime */
const realtimeMock = {
  channel:   () => ({ on: () => realtimeMock, subscribe: noop, unsubscribe: noop }),
  subscribe: noop,
};

/** Client Supabase mock principal */
export const supabase = {
  from:    () => new QueryBuilder(),
  rpc:     () => resolvedEmpty,
  auth:    authMock,
  storage: storageMock,
  channel: realtimeMock.channel,
  removeAllChannels: noop,
  removeChannel: noop,
};

export default supabase;
