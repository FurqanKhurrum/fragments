# 404 Not Found Test
GET http://localhost:3000/no-such-route

# We should get back an HTTP 1.1 404 response
HTTP/1.1 404

# Extra checks to perform against the response
[Asserts]

# We expect the response to have a 404 status code
status == 404
