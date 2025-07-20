# tests/integration/post-fragments-charset.hurl

# Test posting a fragment with a charset in the Content-Type
POST http://localhost:3000/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1
```
This is a fragment with charset
```

# We should get back an HTTP 1.1 201 response
HTTP/1.1 201

# Response should include fragment metadata
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
header "Location" matches /^http:\/\/localhost:3000\/v1\/fragments\/[A-Za-z0-9_-]+$/
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"

# Capture the fragment ID for the next request
[Captures]
fragmentId: jsonpath "$.fragment.id"

# Now GET the fragment to confirm the type is preserved
GET http://localhost:3000/v1/fragments/{{fragmentId}}
[BasicAuth]
user1@email.com:password1

# Should return the fragment with correct Content-Type
HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain; charset=utf-8"
body == "This is a fragment with charset\n"
