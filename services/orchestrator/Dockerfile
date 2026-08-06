# Stage 1: Compile the Go binary
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum to cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy service source code
COPY . .

# Compile optimized static binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o orchestrator cmd/main.go

# Stage 2: Minimal runner container
FROM alpine:3.19

RUN apk --no-cache add ca-certificates curl

WORKDIR /app

# Copy the compiled binary from builder stage
COPY --from=builder /app/orchestrator .

# Expose default HTTP Port
EXPOSE 5001

CMD ["./orchestrator"]
