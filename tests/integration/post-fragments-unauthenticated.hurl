# tests/integration/post-fragments-unauthenticated.hurl

# Test posting a fragment without authentication
POST http://localhost:3000/v1/fragments
Content-Type: text/plain
```
This fragment should be rejected
```

# We should get back an HTTP 1.1 401 response (Unauthorized)
HTTP/1.1 401

# Response should indicate authentication is required
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" contains "Unauthorized"
