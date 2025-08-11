# tests/integration/lab-10-dynamodb.hurl
# DynamoDB Integration Test - Complete fragment lifecycle with metadata and data storage

# 1. POST a new JSON fragment to http://localhost:3000 as an authorized user
POST http://localhost:3000/v1/fragments
# We're sending a JSON fragment
Content-Type: application/json
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`{"service": "DynamoDB"}`

# 2. We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:3000\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# Our fragment ids use UUIDs, see https://ihateregex.io/expr/uuid/
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "application/json"
# Capture the Location URL into a variable named `fragment1_url`
# Capture the fragment id into a variable named `fragment1_id`
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3. Try to GET the fragment info (metadata) we just posted by its URL
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 4. POST a second Markdown fragment to http://localhost:3000 as the same authorized user
POST http://localhost:3000/v1/fragments
# We're sending a Markdown fragment
Content-Type: text/markdown
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
`DynamoDB is **great**.`

# 5. We expect to get back an HTTP 201
HTTP/1.1 201
# We have various assertions about the response that we want to check
[Asserts]
# The Location header should look like what we expect (including the fragment id)
header "Location" matches "^http:\/\/localhost:3000\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
# Our fragment ids use UUIDs
jsonpath "$.fragment.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
# Our ownerId hash is a hex encoded string
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
# Basic check for the presence of created and updated date strings
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.type" == "text/markdown"

# Capture the Location URL into a variable named `fragment2_url`
# Capture the fragment id into a variable named `fragment2_id`
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. Try to GET the fragment info (metadata) we just posted by its URL
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.updated" isString

# 7. Get list of fragments by Authenticated GET to /v1/fragments
GET http://localhost:3000/v1/fragments
[BasicAuth]
user1@email.com:password1

# We expect to get back an HTTP 200
HTTP/1.1 200

# Assert that the fragments array contains the two ids we captured earlier
[Asserts]
jsonpath "$.fragments[*]" includes {{fragment1_id}}
jsonpath "$.fragments[*]" includes {{fragment2_id}}

# 8. DELETE the first fragment
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 9. We expect to get back an HTTP 200
HTTP/1.1 200

# 10. Try to GET the first fragment again using the url as an authorized user
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 11. We should get back an HTTP 404 response
HTTP/1.1 404

# 12. Get list of fragments by Authenticated GET to /v1/fragments
GET http://localhost:3000/v1/fragments
[BasicAuth]
user1@email.com:password1

# We expect to get back an HTTP 200
HTTP/1.1 200

# Assert that the fragments array does NOT contain the first id but DOES contain the second id
[Asserts]
jsonpath "$.fragments[*]" not includes {{fragment1_id}}
jsonpath "$.fragments[*]" includes {{fragment2_id}}
