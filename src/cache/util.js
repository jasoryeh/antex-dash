// cache utils
const CACHE_PREFIX = 'cache_';

/**
 * 
 * @param {KVNamespace} cache_namespace The namespace of the cache defined in `env` (typically found in env.NAMESPACE_NAME_IN_TOML)
 * @param {*} prefix A prefix to use if not the default prefix
 */
module.exports = function (cache_namespace, prefix = null) {
    prefix = prefix ?? CACHE_PREFIX;

    async function get(key) {
        return await cache_namespace.get(prefix + key, {type: 'json'});
    }

    async function set(key, value) {
        return await cache_namespace.put(prefix + key, JSON.stringify(value));
    }

    return {
        get,
        set,
    };

}