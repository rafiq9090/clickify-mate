# Stage 1: Build the Rust binary
FROM rust:slim AS builder

WORKDIR /app/webhook-rust
COPY . .
RUN cargo build --release

# Stage 2: Minimal runner container
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/webhook-rust/target/release/webhook_rust .
EXPOSE 5004
CMD ["./webhook_rust"]
