# tests/integration/post-fragment.hurl

# 1. Authenticated POST /v1/fragments
######################################
POST http://localhost:3000/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`This is a fragment!`

# 1.1 Response
# ############
HTTP/1.1 201

[Asserts]
header "Location" matches "^(http:\/\/)?localhost:3000\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19

# 2. End-to-end
######################################
[Captures]
url: header "Location"

# 2.1. GET /v1/fragments/:id
# ##########################
GET {{url}}
[BasicAuth]
user1@email.com:password1

# 2.2 Response
# ############
HTTP/1.1 200
Content-Type: text/plain
Content-Length: 19

[Asserts]
body == "This is a fragment!"
