var config = {
  backend: 'http://localhost:9080/api/v3/agent/subscribe',
  service: {
	"uuid": Math.random().toString(36).substring(7),
	"host":"PUBLIC_IP_HERE",
	"port": 18088,
	"protocol": "http",
	"path": "/get",
	"type": "cdr",
	"ttl": 300,
	"node": "cgrates",
	"gid": 10
  },
  debug: true,
  cgrates: {
	"url": "api_url",
	"tenant": "cgrates.org"
  }
};

module.exports = config;
