# tests/integration/404.hurl

# 1. 404 Test
######################################
GET http://localhost:3000/no-such-route

# 1.1 Response
# ############
HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "not found"
