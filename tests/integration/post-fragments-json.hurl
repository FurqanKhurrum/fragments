# tests/integration/post-fragments-json.hurl

# Test posting a JSON fragment
POST http://localhost:3000/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
```
{"message": "Hello World", "status": "success"}
```

# We should get back an HTTP 1.1 201 response
HTTP/1.1 201

# Response should include fragment metadata
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
header "Location" matches /^http:\/\/localhost:3000\/v1\/fragments\/[A-Za-z0-9_-]+$/
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 48

# Capture the fragment ID for the next request
[Captures]
fragmentId: jsonpath "$.fragment.id"

# Now GET the fragment to confirm it returns the expected JSON
GET http://localhost:3000/v1/fragments/{{fragmentId}}
[BasicAuth]
user1@email.com:password1

# Should return the JSON fragment with correct Content-Type
HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json"
jsonpath "$.message" == "Hello World"
jsonpath "$.status" == "success"
