# tests/integration/post-fragments-unauthenticated.hurl

# tests/integration/post-fragment.hurl

# 1. Unauthenticated POST /v1/fragments
#######################################
POST http://localhost:3000/v1/fragments
Content-Type: text/plain
`This is a fragment!`

# 1.1 Response
# ############
HTTP/1.1 401

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
