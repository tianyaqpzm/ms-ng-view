const PROXY_CONFIG = {
    "/rest": {
        "target": "http://localhost:8080",
        "secure": false,
        "changeOrigin": true,
        "logLevel": "debug",
        "onProxyRes": function (proxyRes, req, res) {
            // 强制覆盖后端返回的 Header
            proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        }
    }
};

module.exports = PROXY_CONFIG;