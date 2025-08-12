# tests/integration/post-fragments-image.hurl
# Test creating image fragments

# 1. POST a PNG image fragment using base64 with proper decoding
POST http://localhost:3000/v1/fragments
Content-Type: image/png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# Hurl will decode this base64 to binary when using base64 prefix
base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx8gAAAABJRU5ErkJggg==;

HTTP 201
[Captures]
png_url: header "Location"
png_id: jsonpath "$.fragment.id"

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/png"
jsonpath "$.fragment.size" == 70
header "Location" matches "^http://localhost:3000/v1/fragments/[A-Za-z0-9_-]+$"

# 2. GET the PNG fragment
GET {{png_url}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200
[Asserts]
header "Content-Type" == "image/png"

# 3. Convert PNG to JPEG
GET http://localhost:3000/v1/fragments/{{png_id}}.jpg
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200
[Asserts]
header "Content-Type" == "image/jpeg"

# 4. Convert PNG to WebP
GET http://localhost:3000/v1/fragments/{{png_id}}.webp
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200
[Asserts]
header "Content-Type" == "image/webp"

# 5. POST a JPEG image fragment
POST http://localhost:3000/v1/fragments
Content-Type: image/jpeg
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
# Minimal valid JPEG (base64 encoded)
base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z;

HTTP 201
[Captures]
jpeg_url: header "Location"
jpeg_id: jsonpath "$.fragment.id"

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/jpeg"

# 6. Convert JPEG to PNG
GET http://localhost:3000/v1/fragments/{{jpeg_id}}.png
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200
[Asserts]
header "Content-Type" == "image/png"

# 7. Test unsupported image conversion (image to text)
GET http://localhost:3000/v1/fragments/{{png_id}}.txt
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 415
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 415

# 8. Test WebP support
POST http://localhost:3000/v1/fragments
Content-Type: image/webp
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==
base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAABIlpAADcBsAP77AAAA;

HTTP 201
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "image/webp"

# 9. DELETE an image fragment
DELETE http://localhost:3000/v1/fragments/{{png_id}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 200

# 10. Verify deleted fragment returns 404
GET http://localhost:3000/v1/fragments/{{png_id}}
Authorization: Basic dXNlcjFAZW1haWwuY29tOnBhc3N3b3JkMQ==

HTTP 404
