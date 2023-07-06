
const {
    toCookie
} = require('./util');

// keys for session cookies
const SB_SESSION = 'shiftboardSession';
const SB_SESSION_SIG = `${SB_SESSION}.sig`;
function getShiftboardSession(cookies) {
    return {
        session: cookies[SB_SESSION],
        sig: cookies[SB_SESSION_SIG]
    };
}

function shiftboardSessionToCookies(session) {
    var cookies = {};
    cookies[SB_SESSION] = session.session;
    cookies[SB_SESSION_SIG] = session.sig;

    return toCookie(cookies);
}

module.exports = {
    getShiftboardSession,
    shiftboardSessionToCookies
}