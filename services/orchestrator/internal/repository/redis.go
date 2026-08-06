package repository

import (
	"context"
	"github.com/redis/go-redis/v9"
)

type RedisRepository struct {
	Client *redis.Client
}

func NewRedisRepository(addr string, password string, db int) (*RedisRepository, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisRepository{Client: client}, nil
}
