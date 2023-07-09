const {
    shiftboard_proxy_get_request
} = require('./common');
const membersCache = require('../cache/members');

async function news(session, key) {
    let url = `https://m.shiftboard.com/api/v1/news`;
    let req = await shiftboard_proxy_get_request(session, key, url);
    if (!req.ok) {
        return null;
    }
    return req;
}

async function me(session, key) {
    let url = `https://m.shiftboard.com/api/v1/me`;
    let req = await shiftboard_proxy_get_request(session, key, url);
    if (!req.ok) {
        return null;
    }
    return req;
}

async function cacheMember(memberObject) {
    await membersCache.addMember(memberObject.account_id, memberObject);
}

module.exports = {
    news,
    me,
    cacheMember,
}