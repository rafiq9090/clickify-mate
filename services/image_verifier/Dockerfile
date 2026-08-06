# Stage 1: Build the Rust binary
FROM rust:slim AS builder

# Install protobuf compiler (required by tonic-build)
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*

WORKDIR /app/image-verifier

# Copy all source files
COPY . .

# Compile the production binary in release mode
RUN cargo build --release

# Stage 2: Minimal runner container
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy compiled binary from builder
COPY --from=builder /app/image-verifier/target/release/image-verifier-server .

# Expose gRPC port
EXPOSE 5002

CMD ["./image-verifier-server"]
