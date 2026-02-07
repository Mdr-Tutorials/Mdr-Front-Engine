FROM golang:1.25-alpine AS builder

WORKDIR /src

COPY apps/backend/go.mod apps/backend/go.sum ./apps/backend/
RUN cd apps/backend && go mod download

COPY apps/backend ./apps/backend

RUN cd apps/backend && CGO_ENABLED=0 GOOS=linux go build -o /out/backend .

FROM alpine:3.21

RUN adduser -D -g '' appuser
USER appuser
WORKDIR /app

COPY --from=builder /out/backend /app/backend

EXPOSE 8080
ENTRYPOINT ["/app/backend"]
