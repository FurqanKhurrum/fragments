# tests/integration/put-fragments.hurl
# Test updating fragments with PUT

# 1. Create a text fragment
POST http://localhost:3000/v1/fragments
Content-Type: text/plain
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
```
Original text
```

HTTP 201
[Captures]
fragment_id: jsonpath "$.fragment.id"
original_updated: jsonpath "$.fragment.updated"

# 2. Update the fragment with new data (same type)
PUT http://localhost:3000/v1/fragments/{{fragment_id}}
Content-Type: text/plain
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
```
Updated text content
```

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 20
# Updated timestamp should be different
jsonpath "$.fragment.updated" != "{{original_updated}}"

# 3. Verify the content was updated
GET http://localhost:3000/v1/fragments/{{fragment_id}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200
[Asserts]
body == "Updated text content"

# 4. Try to update with different type (should fail)
PUT http://localhost:3000/v1/fragments/{{fragment_id}}
Content-Type: application/json
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
```
{"test": "data"}
```

HTTP 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400
jsonpath "$.error.message" contains "cannot be changed"

# 5. Try to update non-existent fragment
PUT http://localhost:3000/v1/fragments/non-existent-id
Content-Type: text/plain
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
```
Some text
```

HTTP 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404

# 6. Test updating an image fragment
POST http://localhost:3000/v1/fragments
Content-Type: image/png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx8gAAAABJRU5ErkJggg==;

HTTP 201
[Captures]
image_id: jsonpath "$.fragment.id"

# 7. Update the image with new PNG data
PUT http://localhost:3000/v1/fragments/{{image_id}}
Content-Type: image/png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# Different PNG (1x1 blue pixel)
base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==;

HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"

# 8. Test unauthenticated PUT request
PUT http://localhost:3000/v1/fragments/{{fragment_id}}
Content-Type: text/plain
```
Unauthorized update
```

HTTP 401
