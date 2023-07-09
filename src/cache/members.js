// schedule caching

const scheduleCache = require('./util')(ANTEXDASH, 'cache_members_');
const KEY_MEMBERS = "members_list"
async function get() {
    let members = await scheduleCache.get(KEY_MEMBERS);
    if (!members) {
        await scheduleCache.set(KEY_MEMBERS, {});
    }
    return await scheduleCache.get(KEY_MEMBERS);
}

async function set(value) {
    return await scheduleCache.set(KEY_MEMBERS, value);
}

async function addMember(id, data) {
    let members = await get();
    members[id] = data;
    await set(members);
}

module.exports = {
    get,
    addMember,
}