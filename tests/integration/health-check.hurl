# tests/integration/health-check.hurl

# 1. Health Check Test
######################################
GET http://localhost:3000

# 1.1 Response
# ############
HTTP/1.1 200
Cache-Control: no-cache

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.author" isString
jsonpath "$.githubUrl" matches /^https:\/\/github.com\/.+/
jsonpath "$.version" matches /^\d+\.\d+\.\d+$/
