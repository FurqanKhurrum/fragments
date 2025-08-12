# test/integration/lab-10-dynamodb.hurl

# 1. POST /v1/fragments
#######################
POST http://localhost:3000/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{
  "service":"DynamoDB"
}

# 1.1 Response
# ============
HTTP/1.1 201

# 1.2 Capture
# ============
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 2. GET /v1/fragments/:id/info
###############################
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# 2.1 Response
# ============
HTTP/1.1 200

[Asserts]
jsonpath "$.fragment.id" == "{{fragment1_id}}"
jsonpath "$.fragment.type" == "application/json"

# 3. POST /v1/fragments
#######################
POST http://localhost:3000/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**`

# 3.1 Response
# ============
HTTP/1.1 201

# 3.2 Capture
# ============
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 4. GET /v1/fragments/:id/info
###############################
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# 4.1 Response
# ============
HTTP/1.1 200

[Asserts]
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.type" == "text/markdown"

# 5. GET /v1/fragments
######################
GET http://localhost:3000/v1/fragments
[BasicAuth]
user1@email.com:password1

# 5.1 Response
# ============
HTTP/1.1 200

[Asserts]
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# 6. DELETE /v1/fragments/:id
#############################
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 6.1 Response
# ============
HTTP/1.1 200

# 7. GET /v1/fragments/:id
###############################
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 7.1 Response
# ============
HTTP/1.1 404

# 8. GET /v1/fragments
######################
GET http://localhost:3000/v1/fragments
[BasicAuth]
user1@email.com:password1

# 8.1 Response
# ============
HTTP/1.1 200

[Asserts]
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}
