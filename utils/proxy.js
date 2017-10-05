let HttpsProxyAgent = require('https-proxy-agent');


module.exports = class Proxy {
    constructor(proxyList) {
        this.free = proxyList.map(proxy => new HttpsProxyAgent(proxy));
        this.using = [];
    }

    getProxy() {
        let proxy = this.free.splice(0, 1);
        this.using.push(proxy[0]);

        return proxy[0];
    }

    releaseProxy(proxy) {
        let index = this.using.indexOf(proxy);
        this.using.splice(index, 1);

        this.free.push(proxy);
    }
};