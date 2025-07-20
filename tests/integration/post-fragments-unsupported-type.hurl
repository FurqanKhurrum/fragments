# tests/integration/post-fragments-unsupported-type.hurl

# Test posting a fragment with an unsupported Content-Type
POST http://localhost:3000/v1/fragments
Content-Type: application/pdf
[BasicAuth]
user1@email.com:password1
```
This is some binary data that would be a PDF
```

# We should get back an HTTP 1.1 415 response (Unsupported Media Type)
HTTP/1.1 415

# Response should be JSON with error details
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415
jsonpath "$.error.message" contains "Unsupported"
