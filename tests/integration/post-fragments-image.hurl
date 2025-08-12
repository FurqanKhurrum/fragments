# tests/integration/post-fragments-json.hurl

# 1. Authenticated JSON POST /v1/fragments
######################################
POST http://localhost:3000/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "firstName":"Furqan",
  "lastName":"Khurrum"
}

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
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 50

# 2. End-to-end
######################################
[Captures]
url: header "Location"

GET {{url}}
[BasicAuth]
user1@email.com:password1

# 2.1 Response
######################################
HTTP/1.1 200
Content-Type: application/json
Content-Length: 50

[Asserts]
jsonpath "$.firstName" == "Furqan"
jsonpath "$.lastName" == "Khurrum"
