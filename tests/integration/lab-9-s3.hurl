# tests/integration/lab-9-s3.hurl
# Integration test for S3 functionality - complete fragment lifecycle

# 1. POST a new text fragment to http://localhost:3000 as an authorized user
# The fragment's body should be the string "Hello S3!"
POST http://localhost:3000/v1/fragments
Content-Type: text/plain
# Using basic auth with user1@email.com:password1
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

`Hello S3!`

# 2. Confirm that the server returns a 201, and capture the Location header value to a variable named url
HTTP 201
[Captures]
url: header "Location"

# Verify the response structure
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 9
header "Location" matches "^http://localhost:3000/v1/fragments/[A-Za-z0-9_-]+$"

# 3. GET the fragment you just created using the url as an authorized user
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 4. Confirm that the server returns a 200, that the type of the fragment is text/plain, 
# and that the body is equal to "Hello S3!"
HTTP 200
[Asserts]
header "Content-Type" == "text/plain"
body == "Hello S3!"

# 5. DELETE the fragment using the url as an authorized user
DELETE {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 6. Confirm that the server returns a 200
HTTP 200

# 7. Try to GET the fragment again using the url as an authorized user
GET {{url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

# 8. Confirm that the server returns a 404, since the fragment should be deleted
HTTP 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"
